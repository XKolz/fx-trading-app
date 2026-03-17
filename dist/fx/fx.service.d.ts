import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { Currency } from '../common/enums/currency.enum';
export declare class FxService {
    private configService;
    private cacheManager;
    private readonly logger;
    private readonly RATES_CACHE_PREFIX;
    constructor(configService: ConfigService, cacheManager: Cache);
    getRates(baseCurrency?: Currency): Promise<Record<string, number>>;
    getRate(fromCurrency: Currency, toCurrency: Currency): Promise<number>;
    getAllRates(): Promise<{
        base: string;
        rates: Record<string, number>;
        cached: boolean;
    }>;
    private fetchAndCacheRates;
    private getMockRates;
}
