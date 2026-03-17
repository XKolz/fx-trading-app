"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var FxService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FxService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const common_2 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const axios_1 = require("axios");
const currency_enum_1 = require("../common/enums/currency.enum");
let FxService = FxService_1 = class FxService {
    constructor(configService, cacheManager) {
        this.configService = configService;
        this.cacheManager = cacheManager;
        this.logger = new common_1.Logger(FxService_1.name);
        this.RATES_CACHE_PREFIX = 'fx_rates_';
    }
    async getRates(baseCurrency = currency_enum_1.Currency.NGN) {
        const cacheKey = `${this.RATES_CACHE_PREFIX}${baseCurrency}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            this.logger.debug(`FX rates for ${baseCurrency} served from cache`);
            return cached;
        }
        return this.fetchAndCacheRates(baseCurrency);
    }
    async getRate(fromCurrency, toCurrency) {
        if (fromCurrency === toCurrency) {
            throw new common_1.BadRequestException('Source and target currencies must be different');
        }
        const rates = await this.getRates(fromCurrency);
        const rate = rates[toCurrency];
        if (!rate) {
            throw new common_1.BadRequestException(`Exchange rate not available for ${fromCurrency} → ${toCurrency}`);
        }
        return rate;
    }
    async getAllRates() {
        const cacheKey = `${this.RATES_CACHE_PREFIX}${currency_enum_1.Currency.NGN}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            const filtered = Object.fromEntries(currency_enum_1.SUPPORTED_CURRENCIES
                .filter((c) => c !== currency_enum_1.Currency.NGN && cached[c])
                .map((c) => [c, cached[c]]));
            return { base: currency_enum_1.Currency.NGN, rates: filtered, cached: true };
        }
        const rates = await this.fetchAndCacheRates(currency_enum_1.Currency.NGN);
        const filtered = Object.fromEntries(currency_enum_1.SUPPORTED_CURRENCIES
            .filter((c) => c !== currency_enum_1.Currency.NGN && rates[c])
            .map((c) => [c, rates[c]]));
        return { base: currency_enum_1.Currency.NGN, rates: filtered, cached: false };
    }
    async fetchAndCacheRates(baseCurrency) {
        const apiKey = this.configService.get('fx.apiKey');
        const baseUrl = this.configService.get('fx.apiBaseUrl');
        const cacheTtl = this.configService.get('fx.cacheTtl') * 1000;
        if (!apiKey) {
            this.logger.warn('FX_API_KEY not set, using fallback mock rates');
            return this.getMockRates(baseCurrency);
        }
        const maxRetries = 3;
        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const url = `${baseUrl}/${apiKey}/latest/${baseCurrency}`;
                const response = await axios_1.default.get(url, {
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
            }
            catch (error) {
                lastError = error;
                this.logger.warn(`FX rate fetch attempt ${attempt} failed: ${error.message}`);
                if (attempt < maxRetries) {
                    await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
                }
            }
        }
        this.logger.error(`All ${maxRetries} FX rate fetch attempts failed`);
        throw new common_1.ServiceUnavailableException('FX rate service temporarily unavailable. Please try again shortly.');
    }
    getMockRates(baseCurrency) {
        const ngnRates = {
            NGN: 1,
            USD: 0.00065,
            EUR: 0.00060,
            GBP: 0.00052,
            JPY: 0.097,
            CAD: 0.00088,
            AUD: 0.00100,
            CHF: 0.00059,
        };
        if (baseCurrency === currency_enum_1.Currency.NGN) {
            return ngnRates;
        }
        const baseToNgn = 1 / ngnRates[baseCurrency];
        const result = {};
        for (const [currency, rate] of Object.entries(ngnRates)) {
            result[currency] = rate * baseToNgn;
        }
        return result;
    }
};
exports.FxService = FxService;
exports.FxService = FxService = FxService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_2.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [config_1.ConfigService, Object])
], FxService);
//# sourceMappingURL=fx.service.js.map