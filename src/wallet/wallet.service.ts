import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Wallet } from './entities/wallet.entity';
import { WalletBalance } from './entities/wallet-balance.entity';
import { Transaction } from '../transactions/transaction.entity';
import { FxService } from '../fx/fx.service';
import { Currency } from '../common/enums/currency.enum';
import {
  TransactionType,
  TransactionStatus,
} from '../common/enums/transaction-type.enum';
import { FundWalletDto } from './dto/fund-wallet.dto';
import { ConvertDto } from './dto/convert.dto';
import { TradeDto } from './dto/trade.dto';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(WalletBalance)
    private walletBalanceRepository: Repository<WalletBalance>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private fxService: FxService,
    private dataSource: DataSource,
  ) {}

  async createWallet(userId: string): Promise<Wallet> {
    const wallet = this.walletRepository.create({
      userId,
      balances: [
        this.walletBalanceRepository.create({
          currency: Currency.NGN,
          balance: '0',
        }),
      ],
    });
    return this.walletRepository.save(wallet);
  }

  async getWallet(userId: string): Promise<Wallet> {
    const wallet = await this.walletRepository.findOne({
      where: { userId },
      relations: ['balances'],
    });
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }
    return wallet;
  }

  async fundWallet(userId: string, dto: FundWalletDto): Promise<Transaction> {
    // Idempotency check
    if (dto.idempotencyKey) {
      const existing = await this.transactionRepository.findOne({
        where: { reference: dto.idempotencyKey, userId },
      });
      if (existing) {
        return existing;
      }
    }

    return this.dataSource.transaction(async (manager) => {
      const wallet = await manager.findOne(Wallet, {
        where: { userId },
        lock: { mode: 'pessimistic_write' },
        loadEagerRelations: false,
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      const balance = await this.getOrCreateBalance(
        manager,
        wallet.id,
        dto.currency,
      );

      balance.balance = (
        parseFloat(balance.balance) + dto.amount
      ).toFixed(8);
      await manager.save(WalletBalance, balance);

      const transaction = manager.create(Transaction, {
        userId,
        type: TransactionType.FUNDING,
        toCurrency: dto.currency,
        toAmount: dto.amount.toString(),
        status: TransactionStatus.COMPLETED,
        reference: dto.idempotencyKey || uuidv4(),
        description: `Wallet funded with ${dto.amount} ${dto.currency}`,
      });

      return manager.save(Transaction, transaction);
    });
  }

  async convert(userId: string, dto: ConvertDto): Promise<Transaction> {
    if (dto.fromCurrency === dto.toCurrency) {
      throw new BadRequestException('Source and target currencies must be different');
    }

    // Fetch rate BEFORE the transaction to avoid holding DB lock during HTTP call
    const rate = await this.fxService.getRate(dto.fromCurrency, dto.toCurrency);
    const toAmount = parseFloat((dto.amount * rate).toFixed(8));

    return this.dataSource.transaction(async (manager) => {
      const wallet = await manager.findOne(Wallet, {
        where: { userId },
        lock: { mode: 'pessimistic_write' },
        loadEagerRelations: false,
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      // Lock and deduct from source
      const fromBalance = await this.getLockedBalance(
        manager,
        wallet.id,
        dto.fromCurrency,
      );

      const currentFromBalance = parseFloat(fromBalance?.balance || '0');
      if (!fromBalance || currentFromBalance < dto.amount) {
        throw new BadRequestException(
          `Insufficient ${dto.fromCurrency} balance. Available: ${currentFromBalance.toFixed(2)}, Required: ${dto.amount}`,
        );
      }

      fromBalance.balance = (currentFromBalance - dto.amount).toFixed(8);
      await manager.save(WalletBalance, fromBalance);

      // Credit target currency
      const toBalance = await this.getOrCreateBalance(
        manager,
        wallet.id,
        dto.toCurrency,
      );
      toBalance.balance = (parseFloat(toBalance.balance) + toAmount).toFixed(8);
      await manager.save(WalletBalance, toBalance);

      const transaction = manager.create(Transaction, {
        userId,
        type: TransactionType.CONVERSION,
        fromCurrency: dto.fromCurrency,
        toCurrency: dto.toCurrency,
        fromAmount: dto.amount.toString(),
        toAmount: toAmount.toString(),
        rate: rate.toString(),
        status: TransactionStatus.COMPLETED,
        reference: uuidv4(),
        description: `Converted ${dto.amount} ${dto.fromCurrency} to ${toAmount} ${dto.toCurrency} @ ${rate}`,
      });

      return manager.save(Transaction, transaction);
    });
  }

  async trade(userId: string, dto: TradeDto): Promise<Transaction> {
    // Validate that at least one currency is NGN
    if (dto.fromCurrency !== Currency.NGN && dto.toCurrency !== Currency.NGN) {
      throw new BadRequestException(
        'Trade must involve NGN. Use /wallet/convert for cross-currency conversions.',
      );
    }

    if (dto.fromCurrency === dto.toCurrency) {
      throw new BadRequestException('Source and target currencies must be different');
    }

    // Fetch rate BEFORE the transaction
    const rate = await this.fxService.getRate(dto.fromCurrency, dto.toCurrency);
    const toAmount = parseFloat((dto.amount * rate).toFixed(8));

    return this.dataSource.transaction(async (manager) => {
      const wallet = await manager.findOne(Wallet, {
        where: { userId },
        lock: { mode: 'pessimistic_write' },
        loadEagerRelations: false,
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      // Lock and deduct from source
      const fromBalance = await this.getLockedBalance(
        manager,
        wallet.id,
        dto.fromCurrency,
      );

      const currentFromBalance = parseFloat(fromBalance?.balance || '0');
      if (!fromBalance || currentFromBalance < dto.amount) {
        throw new BadRequestException(
          `Insufficient ${dto.fromCurrency} balance. Available: ${currentFromBalance.toFixed(2)}, Required: ${dto.amount}`,
        );
      }

      fromBalance.balance = (currentFromBalance - dto.amount).toFixed(8);
      await manager.save(WalletBalance, fromBalance);

      // Credit target currency
      const toBalance = await this.getOrCreateBalance(
        manager,
        wallet.id,
        dto.toCurrency,
      );
      toBalance.balance = (parseFloat(toBalance.balance) + toAmount).toFixed(8);
      await manager.save(WalletBalance, toBalance);

      const transaction = manager.create(Transaction, {
        userId,
        type: TransactionType.TRADE,
        fromCurrency: dto.fromCurrency,
        toCurrency: dto.toCurrency,
        fromAmount: dto.amount.toString(),
        toAmount: toAmount.toString(),
        rate: rate.toString(),
        status: TransactionStatus.COMPLETED,
        reference: uuidv4(),
        description: `Traded ${dto.amount} ${dto.fromCurrency} for ${toAmount} ${dto.toCurrency} @ ${rate}`,
      });

      return manager.save(Transaction, transaction);
    });
  }

  private async getOrCreateBalance(
    manager: EntityManager,
    walletId: string,
    currency: Currency,
  ): Promise<WalletBalance> {
    let balance = await manager.findOne(WalletBalance, {
      where: { walletId, currency },
    });

    if (!balance) {
      balance = manager.create(WalletBalance, {
        walletId,
        currency,
        balance: '0',
      });
    }

    return balance;
  }

  private async getLockedBalance(
    manager: EntityManager,
    walletId: string,
    currency: Currency,
  ): Promise<WalletBalance | null> {
    return manager
      .getRepository(WalletBalance)
      .createQueryBuilder('wb')
      .setLock('pessimistic_write')
      .where('wb.walletId = :walletId AND wb.currency = :currency', {
        walletId,
        currency,
      })
      .getOne();
  }
}
