import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { WalletService } from './wallet.service';
import { Wallet } from './entities/wallet.entity';
import { WalletBalance } from './entities/wallet-balance.entity';
import { Transaction } from '../transactions/transaction.entity';
import { FxService } from '../fx/fx.service';
import { Currency } from '../common/enums/currency.enum';
import { TransactionType, TransactionStatus } from '../common/enums/transaction-type.enum';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const mockWallet = {
  id: 'wallet-uuid',
  userId: 'user-uuid',
  balances: [],
};

const mockBalance = {
  id: 'balance-uuid',
  walletId: 'wallet-uuid',
  currency: Currency.NGN,
  balance: '10000.00000000',
};

const mockTransaction = {
  id: 'tx-uuid',
  userId: 'user-uuid',
  type: TransactionType.FUNDING,
  toCurrency: Currency.NGN,
  toAmount: '5000',
  status: TransactionStatus.COMPLETED,
  reference: 'ref-1',
  createdAt: new Date(),
};

describe('WalletService', () => {
  let service: WalletService;
  let fxService: jest.Mocked<FxService>;
  let dataSource: jest.Mocked<DataSource>;

  const mockWalletRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockBalanceRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockTransactionRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockEntityManager = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    getRepository: jest.fn(),
  };

  const mockQueryBuilder = {
    setLock: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  };

  beforeEach(async () => {
    mockEntityManager.getRepository.mockReturnValue({
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    });

    const mockDataSource = {
      transaction: jest.fn().mockImplementation((cb) => cb(mockEntityManager)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: getRepositoryToken(Wallet), useValue: mockWalletRepo },
        { provide: getRepositoryToken(WalletBalance), useValue: mockBalanceRepo },
        { provide: getRepositoryToken(Transaction), useValue: mockTransactionRepo },
        {
          provide: FxService,
          useValue: { getRate: jest.fn(), getRates: jest.fn() },
        },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    fxService = module.get(FxService);
    dataSource = module.get(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fundWallet', () => {
    it('should fund wallet and return a transaction', async () => {
      mockTransactionRepo.findOne.mockResolvedValue(null);
      mockEntityManager.findOne.mockResolvedValue(mockWallet);
      mockQueryBuilder.getOne.mockResolvedValue(mockBalance);
      mockEntityManager.save.mockImplementation((entity, data) => Promise.resolve(data));
      mockEntityManager.create.mockImplementation((entity, data) => data);

      const result = await service.fundWallet('user-uuid', {
        currency: Currency.NGN,
        amount: 5000,
      });

      expect(mockEntityManager.findOne).toHaveBeenCalledWith(
        Wallet,
        expect.objectContaining({ where: { userId: 'user-uuid' } }),
      );
    });

    it('should return existing transaction for duplicate idempotency key', async () => {
      mockTransactionRepo.findOne.mockResolvedValue(mockTransaction);

      const result = await service.fundWallet('user-uuid', {
        currency: Currency.NGN,
        amount: 5000,
        idempotencyKey: 'ref-1',
      });

      expect(result).toEqual(mockTransaction);
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if wallet not found', async () => {
      mockTransactionRepo.findOne.mockResolvedValue(null);
      mockEntityManager.findOne.mockResolvedValue(null);

      await expect(
        service.fundWallet('user-uuid', { currency: Currency.NGN, amount: 100 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('convert', () => {
    it('should convert currencies successfully', async () => {
      jest.spyOn(fxService, 'getRate').mockResolvedValue(0.00065);

      mockEntityManager.findOne.mockResolvedValue(mockWallet);
      mockQueryBuilder.getOne.mockResolvedValue({ ...mockBalance, balance: '10000.00000000' });
      mockEntityManager.save.mockImplementation((entity, data) => Promise.resolve(data));
      mockEntityManager.create.mockImplementation((entity, data) => data);

      await service.convert('user-uuid', {
        fromCurrency: Currency.NGN,
        toCurrency: Currency.USD,
        amount: 1000,
      });

      expect(fxService.getRate).toHaveBeenCalledWith(Currency.NGN, Currency.USD);
    });

    it('should throw BadRequestException for same currencies', async () => {
      await expect(
        service.convert('user-uuid', {
          fromCurrency: Currency.NGN,
          toCurrency: Currency.NGN,
          amount: 100,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for insufficient balance', async () => {
      jest.spyOn(fxService, 'getRate').mockResolvedValue(0.00065);

      mockEntityManager.findOne.mockResolvedValue(mockWallet);
      mockQueryBuilder.getOne.mockResolvedValue({ ...mockBalance, balance: '100.00000000' });

      await expect(
        service.convert('user-uuid', {
          fromCurrency: Currency.NGN,
          toCurrency: Currency.USD,
          amount: 1000,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('trade', () => {
    it('should throw if neither currency is NGN', async () => {
      await expect(
        service.trade('user-uuid', {
          fromCurrency: Currency.USD,
          toCurrency: Currency.EUR,
          amount: 100,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should trade NGN to USD successfully', async () => {
      jest.spyOn(fxService, 'getRate').mockResolvedValue(0.00065);

      mockEntityManager.findOne.mockResolvedValue(mockWallet);
      mockQueryBuilder.getOne.mockResolvedValue({ ...mockBalance, balance: '100000.00000000' });
      mockEntityManager.save.mockImplementation((entity, data) => Promise.resolve(data));
      mockEntityManager.create.mockImplementation((entity, data) => data);

      await service.trade('user-uuid', {
        fromCurrency: Currency.NGN,
        toCurrency: Currency.USD,
        amount: 1000,
      });

      expect(fxService.getRate).toHaveBeenCalledWith(Currency.NGN, Currency.USD);
    });
  });
});
