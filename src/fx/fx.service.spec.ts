import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { FxService } from './fx.service';
import { Currency } from '../common/enums/currency.enum';
import { ServiceUnavailableException, BadRequestException } from '@nestjs/common';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('FxService', () => {
  let service: FxService;
  let cacheManager: jest.Mocked<any>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockCacheManager = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
    };

    const mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        const config = {
          'fx.apiKey': 'test-api-key',
          'fx.apiBaseUrl': 'https://v6.exchangerate-api.com/v6',
          'fx.cacheTtl': 300,
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FxService,
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<FxService>(FxService);
    cacheManager = module.get(CACHE_MANAGER);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getRates', () => {
    it('should return cached rates if available', async () => {
      const mockRates = { USD: 0.00065, EUR: 0.0006 };
      cacheManager.get.mockResolvedValue(mockRates);

      const result = await service.getRates(Currency.NGN);

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

      const result = await service.getRates(Currency.NGN);

      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      expect(cacheManager.set).toHaveBeenCalledTimes(1);
      expect(result).toEqual(
        expect.objectContaining({ USD: 0.00065 }),
      );
    });

    it('should throw ServiceUnavailableException after all retries fail', async () => {
      cacheManager.get.mockResolvedValue(null);
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      await expect(service.getRates(Currency.NGN)).rejects.toThrow(
        ServiceUnavailableException,
      );
    }, 15000);
  });

  describe('getRate', () => {
    it('should return specific rate between two currencies', async () => {
      const mockRates = { USD: 0.00065, EUR: 0.0006, NGN: 1 };
      cacheManager.get.mockResolvedValue(mockRates);

      const rate = await service.getRate(Currency.NGN, Currency.USD);

      expect(rate).toBe(0.00065);
    });

    it('should throw BadRequestException for same currencies', async () => {
      await expect(
        service.getRate(Currency.NGN, Currency.NGN),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
