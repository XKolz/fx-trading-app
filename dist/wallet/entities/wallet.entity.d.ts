import { User } from '../../users/user.entity';
import { WalletBalance } from './wallet-balance.entity';
export declare class Wallet {
    id: string;
    user: User;
    userId: string;
    balances: WalletBalance[];
    createdAt: Date;
    updatedAt: Date;
}
