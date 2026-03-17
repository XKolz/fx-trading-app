import { Currency } from '../../common/enums/currency.enum';
export declare class FundWalletDto {
    currency: Currency;
    amount: number;
    idempotencyKey?: string;
}
