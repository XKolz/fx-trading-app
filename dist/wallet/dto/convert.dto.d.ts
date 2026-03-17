import { Currency } from '../../common/enums/currency.enum';
export declare class ConvertDto {
    fromCurrency: Currency;
    toCurrency: Currency;
    amount: number;
}
