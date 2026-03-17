"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const cache_manager_1 = require("@nestjs/cache-manager");
const config_1 = require("@nestjs/config");
const fx_service_1 = require("./fx.service");
const currency_enum_1 = require("../common/enums/currency.enum");
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
jest.mock('axios');
const mockedAxios = axios_1.default;
describe('FxService', () => {
    let service;
    let cacheManager;
    let configService;
    beforeEach(async () => {
        const mockCacheManager = {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(undefined),
        };
        const mockConfigService = {
            get: jest.fn().mockImplementation((key) => {
                const config = {
                    'fx.apiKey': 'test-api-key',
                    'fx.apiBaseUrl': 'https://v6.exchangerate-api.com/v6',
                    'fx.cacheTtl': 300,
                };
                return config[key];
            }),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                fx_service_1.FxService,
                { provide: cache_manager_1.CACHE_MANAGER, useValue: mockCacheManager },
                { provide: config_1.ConfigService, useValue: mockConfigService },
            ],
        }).compile();
        service = module.get(fx_service_1.FxService);
        cacheManager = module.get(cache_manager_1.CACHE_MANAGER);
        configService = module.get(config_1.ConfigService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('getRates', () => {
        it('should return cached rates if available', async () => {
            const mockRates = { USD: 0.00065, EUR: 0.0006 };
            cacheManager.get.mockResolvedValue(mockRates);
            const result = await service.getRates(currency_enum_1.Currency.NGN);
            expect(result).toEqual(mockRates);
            expect(mockedAxios.get).not.toHaveBeenCalled();
        });
        it('should fetch rates from API when not cached', async () => {
            cacheManager.get.mockResolvedValue(null);
            mockedAxios.get.mockResolvedValue({
                data: {
                    result: 'success',
                    base_code: 'NGN',
                    conversion_rates: { USD: 0.00065, EUR: 0.0006, NGN: 1 },
                    time_last_update_unix: Date.now(),
                },
            });
            const result = await service.getRates(currency_enum_1.Currency.NGN);
            expect(mockedAxios.get).toHaveBeenCalledTimes(1);
            expect(cacheManager.set).toHaveBeenCalledTimes(1);
            expect(result).toEqual(expect.objectContaining({ USD: 0.00065 }));
        });
        it('should throw ServiceUnavailableException after all retries fail', async () => {
            cacheManager.get.mockResolvedValue(null);
            mockedAxios.get.mockRejectedValue(new Error('Network error'));
            await expect(service.getRates(currency_enum_1.Currency.NGN)).rejects.toThrow(common_1.ServiceUnavailableException);
        }, 15000);
    });
    describe('getRate', () => {
        it('should return specific rate between two currencies', async () => {
            const mockRates = { USD: 0.00065, EUR: 0.0006, NGN: 1 };
            cacheManager.get.mockResolvedValue(mockRates);
            const rate = await service.getRate(currency_enum_1.Currency.NGN, currency_enum_1.Currency.USD);
            expect(rate).toBe(0.00065);
        });
        it('should throw BadRequestException for same currencies', async () => {
            await expect(service.getRate(currency_enum_1.Currency.NGN, currency_enum_1.Currency.NGN)).rejects.toThrow(common_1.BadRequestException);
        });
    });
});
//# sourceMappingURL=fx.service.spec.js.map