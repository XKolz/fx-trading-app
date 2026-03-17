import { WalletService } from './wallet.service';
import { User } from '../users/user.entity';
import { FundWalletDto } from './dto/fund-wallet.dto';
import { ConvertDto } from './dto/convert.dto';
import { TradeDto } from './dto/trade.dto';
export declare class WalletController {
    private walletService;
    constructor(walletService: WalletService);
    getWallet(user: User): Promise<import("./entities/wallet.entity").Wallet>;
    fundWallet(user: User, dto: FundWalletDto): Promise<import("../transactions/transaction.entity").Transaction>;
    convert(user: User, dto: ConvertDto): Promise<import("../transactions/transaction.entity").Transaction>;
    trade(user: User, dto: TradeDto): Promise<import("../transactions/transaction.entity").Transaction>;
}
