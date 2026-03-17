import { User } from '../users/user.entity';
import { Currency } from '../common/enums/currency.enum';
import { TransactionType, TransactionStatus } from '../common/enums/transaction-type.enum';
export declare class Transaction {
    id: string;
    user: User;
    userId: string;
    type: TransactionType;
    fromCurrency: Currency;
    toCurrency: Currency;
    fromAmount: string;
    toAmount: string;
    rate: string;
    status: TransactionStatus;
    reference: string;
    description: string;
    createdAt: Date;
}
