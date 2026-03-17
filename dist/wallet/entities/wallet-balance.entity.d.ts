import { Wallet } from './wallet.entity';
import { Currency } from '../../common/enums/currency.enum';
export declare class WalletBalance {
    id: string;
    wallet: Wallet;
    walletId: string;
    currency: Currency;
    balance: string;
}
