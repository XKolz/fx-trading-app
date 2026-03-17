import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import axios from 'axios';
import { Currency, SUPPORTED_CURRENCIES } from '../common/enums/currency.enum';

interface ExchangeRateApiResponse {
  result: string;
  base_code: string;
  conversion_rates: Record<string, number>;
  time_last_update_unix: number;
}

@Injectable()
export class FxService {
  private readonly logger = new Logger(FxService.name);
  private readonly RATES_CACHE_PREFIX = 'fx_rates_';

  constructor(
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getRates(baseCurrency: Currency = Currency.NGN): Promise<Record<string, number>> {
    const cacheKey = `${this.RATES_CACHE_PREFIX}${baseCurrency}`;

    // Try cache first
    const cached = await this.cacheManager.get<Record<string, number>>(cacheKey);
    if (cached) {
      this.logger.debug(`FX rates for ${baseCurrency} served from cache`);
      return cached;
    }

    return this.fetchAndCacheRates(baseCurrency);
  }

  async getRate(fromCurrency: Currency, toCurrency: Currency): Promise<number> {
    if (fromCurrency === toCurrency) {
      throw new BadRequestException('Source and target currencies must be different');
    }

    const rates = await this.getRates(fromCurrency);
    const rate = rates[toCurrency];

    if (!rate) {
      throw new BadRequestException(
        `Exchange rate not available for ${fromCurrency} → ${toCurrency}`,
      );
    }

    return rate;
  }

  async getAllRates(): Promise<{ base: string; rates: Record<string, number>; cached: boolean }> {
    const cacheKey = `${this.RATES_CACHE_PREFIX}${Currency.NGN}`;
    const cached = await this.cacheManager.get<Record<string, number>>(cacheKey);

    if (cached) {
      // Filter to only supported currencies
      const filtered = Object.fromEntries(
        SUPPORTED_CURRENCIES
          .filter((c) => c !== Currency.NGN && cached[c])
          .map((c) => [c, cached[c]]),
      );
      return { base: Currency.NGN, rates: filtered, cached: true };
    }

    const rates = await this.fetchAndCacheRates(Currency.NGN);
    const filtered = Object.fromEntries(
      SUPPORTED_CURRENCIES
        .filter((c) => c !== Currency.NGN && rates[c])
        .map((c) => [c, rates[c]]),
    );
    return { base: Currency.NGN, rates: filtered, cached: false };
  }

  private async fetchAndCacheRates(baseCurrency: Currency): Promise<Record<string, number>> {
    const apiKey = this.configService.get<string>('fx.apiKey');
    const baseUrl = this.configService.get<string>('fx.apiBaseUrl');
    const cacheTtl = this.configService.get<number>('fx.cacheTtl') * 1000; // ms

    if (!apiKey) {
      this.logger.warn('FX_API_KEY not set, using fallback mock rates');
      return this.getMockRates(baseCurrency);
    }

    const maxRetries = 3;
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const url = `${baseUrl}/${apiKey}/latest/${baseCurrency}`;
        const response = await axios.get<ExchangeRateApiResponse>(url, {
          timeout: 5000,
        });

        if (response.data.result !== 'success') {
          throw new Error(`API returned non-success result: ${response.data.result}`);
        }

        const rates = response.data.conversion_rates;
        const cacheKey = `${this.RATES_CACHE_PREFIX}${baseCurrency}`;
        await this.cacheManager.set(cacheKey, rates, cacheTtl);

        this.logger.log(`FX rates for ${baseCurrency} fetched and cached`);
        return rates;
      } catch (error) {
        lastError = error;
        this.logger.warn(`FX rate fetch attempt ${attempt} failed: ${error.message}`);
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    this.logger.error(`All ${maxRetries} FX rate fetch attempts failed`);
    throw new ServiceUnavailableException(
      'FX rate service temporarily unavailable. Please try again shortly.',
    );
  }

  private getMockRates(baseCurrency: Currency): Record<string, number> {
    // Mock rates relative to NGN (approximate)
    const ngnRates: Record<string, number> = {
      NGN: 1,
      USD: 0.00065,
      EUR: 0.00060,
      GBP: 0.00052,
      JPY: 0.097,
      CAD: 0.00088,
      AUD: 0.00100,
      CHF: 0.00059,
    };

    if (baseCurrency === Currency.NGN) {
      return ngnRates;
    }

    // Convert to base currency
    const baseToNgn = 1 / ngnRates[baseCurrency];
    const result: Record<string, number> = {};
    for (const [currency, rate] of Object.entries(ngnRates)) {
      result[currency] = rate * baseToNgn;
    }
    return result;
  }
}
