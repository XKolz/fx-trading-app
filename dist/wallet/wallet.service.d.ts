import { Repository, DataSource } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import { WalletBalance } from './entities/wallet-balance.entity';
import { Transaction } from '../transactions/transaction.entity';
import { FxService } from '../fx/fx.service';
import { FundWalletDto } from './dto/fund-wallet.dto';
import { ConvertDto } from './dto/convert.dto';
import { TradeDto } from './dto/trade.dto';
export declare class WalletService {
    private walletRepository;
    private walletBalanceRepository;
    private transactionRepository;
    private fxService;
    private dataSource;
    private readonly logger;
    constructor(walletRepository: Repository<Wallet>, walletBalanceRepository: Repository<WalletBalance>, transactionRepository: Repository<Transaction>, fxService: FxService, dataSource: DataSource);
    createWallet(userId: string): Promise<Wallet>;
    getWallet(userId: string): Promise<Wallet>;
    fundWallet(userId: string, dto: FundWalletDto): Promise<Transaction>;
    convert(userId: string, dto: ConvertDto): Promise<Transaction>;
    trade(userId: string, dto: TradeDto): Promise<Transaction>;
    private getOrCreateBalance;
    private getLockedBalance;
}
