"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const wallet_service_1 = require("./wallet.service");
const wallet_entity_1 = require("./entities/wallet.entity");
const wallet_balance_entity_1 = require("./entities/wallet-balance.entity");
const transaction_entity_1 = require("../transactions/transaction.entity");
const fx_service_1 = require("../fx/fx.service");
const currency_enum_1 = require("../common/enums/currency.enum");
const transaction_type_enum_1 = require("../common/enums/transaction-type.enum");
const common_1 = require("@nestjs/common");
const mockWallet = {
    id: 'wallet-uuid',
    userId: 'user-uuid',
    balances: [],
};
const mockBalance = {
    id: 'balance-uuid',
    walletId: 'wallet-uuid',
    currency: currency_enum_1.Currency.NGN,
    balance: '10000.00000000',
};
const mockTransaction = {
    id: 'tx-uuid',
    userId: 'user-uuid',
    type: transaction_type_enum_1.TransactionType.FUNDING,
    toCurrency: currency_enum_1.Currency.NGN,
    toAmount: '5000',
    status: transaction_type_enum_1.TransactionStatus.COMPLETED,
    reference: 'ref-1',
    createdAt: new Date(),
};
describe('WalletService', () => {
    let service;
    let fxService;
    let dataSource;
    const mockWalletRepo = {
        create: jest.fn(),
        save: jest.fn(),
        findOne: jest.fn(),
    };
    const mockBalanceRepo = {
        create: jest.fn(),
        save: jest.fn(),
        findOne: jest.fn(),
    };
    const mockTransactionRepo = {
        create: jest.fn(),
        save: jest.fn(),
        findOne: jest.fn(),
    };
    const mockEntityManager = {
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        getRepository: jest.fn(),
    };
    const mockQueryBuilder = {
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn(),
    };
    beforeEach(async () => {
        mockEntityManager.getRepository.mockReturnValue({
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
        });
        const mockDataSource = {
            transaction: jest.fn().mockImplementation((cb) => cb(mockEntityManager)),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                wallet_service_1.WalletService,
                { provide: (0, typeorm_1.getRepositoryToken)(wallet_entity_1.Wallet), useValue: mockWalletRepo },
                { provide: (0, typeorm_1.getRepositoryToken)(wallet_balance_entity_1.WalletBalance), useValue: mockBalanceRepo },
                { provide: (0, typeorm_1.getRepositoryToken)(transaction_entity_1.Transaction), useValue: mockTransactionRepo },
                {
                    provide: fx_service_1.FxService,
                    useValue: { getRate: jest.fn(), getRates: jest.fn() },
                },
                { provide: typeorm_2.DataSource, useValue: mockDataSource },
            ],
        }).compile();
        service = module.get(wallet_service_1.WalletService);
        fxService = module.get(fx_service_1.FxService);
        dataSource = module.get(typeorm_2.DataSource);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('fundWallet', () => {
        it('should fund wallet and return a transaction', async () => {
            mockTransactionRepo.findOne.mockResolvedValue(null);
            mockEntityManager.findOne.mockResolvedValue(mockWallet);
            mockQueryBuilder.getOne.mockResolvedValue(mockBalance);
            mockEntityManager.save.mockImplementation((entity, data) => Promise.resolve(data));
            mockEntityManager.create.mockImplementation((entity, data) => data);
            const result = await service.fundWallet('user-uuid', {
                currency: currency_enum_1.Currency.NGN,
                amount: 5000,
            });
            expect(mockEntityManager.findOne).toHaveBeenCalledWith(wallet_entity_1.Wallet, expect.objectContaining({ where: { userId: 'user-uuid' } }));
        });
        it('should return existing transaction for duplicate idempotency key', async () => {
            mockTransactionRepo.findOne.mockResolvedValue(mockTransaction);
            const result = await service.fundWallet('user-uuid', {
                currency: currency_enum_1.Currency.NGN,
                amount: 5000,
                idempotencyKey: 'ref-1',
            });
            expect(result).toEqual(mockTransaction);
            expect(dataSource.transaction).not.toHaveBeenCalled();
        });
        it('should throw NotFoundException if wallet not found', async () => {
            mockTransactionRepo.findOne.mockResolvedValue(null);
            mockEntityManager.findOne.mockResolvedValue(null);
            await expect(service.fundWallet('user-uuid', { currency: currency_enum_1.Currency.NGN, amount: 100 })).rejects.toThrow(common_1.NotFoundException);
        });
    });
    describe('convert', () => {
        it('should convert currencies successfully', async () => {
            jest.spyOn(fxService, 'getRate').mockResolvedValue(0.00065);
            mockEntityManager.findOne.mockResolvedValue(mockWallet);
            mockQueryBuilder.getOne.mockResolvedValue({ ...mockBalance, balance: '10000.00000000' });
            mockEntityManager.save.mockImplementation((entity, data) => Promise.resolve(data));
            mockEntityManager.create.mockImplementation((entity, data) => data);
            await service.convert('user-uuid', {
                fromCurrency: currency_enum_1.Currency.NGN,
                toCurrency: currency_enum_1.Currency.USD,
                amount: 1000,
            });
            expect(fxService.getRate).toHaveBeenCalledWith(currency_enum_1.Currency.NGN, currency_enum_1.Currency.USD);
        });
        it('should throw BadRequestException for same currencies', async () => {
            await expect(service.convert('user-uuid', {
                fromCurrency: currency_enum_1.Currency.NGN,
                toCurrency: currency_enum_1.Currency.NGN,
                amount: 100,
            })).rejects.toThrow(common_1.BadRequestException);
        });
        it('should throw BadRequestException for insufficient balance', async () => {
            jest.spyOn(fxService, 'getRate').mockResolvedValue(0.00065);
            mockEntityManager.findOne.mockResolvedValue(mockWallet);
            mockQueryBuilder.getOne.mockResolvedValue({ ...mockBalance, balance: '100.00000000' });
            await expect(service.convert('user-uuid', {
                fromCurrency: currency_enum_1.Currency.NGN,
                toCurrency: currency_enum_1.Currency.USD,
                amount: 1000,
            })).rejects.toThrow(common_1.BadRequestException);
        });
    });
    describe('trade', () => {
        it('should throw if neither currency is NGN', async () => {
            await expect(service.trade('user-uuid', {
                fromCurrency: currency_enum_1.Currency.USD,
                toCurrency: currency_enum_1.Currency.EUR,
                amount: 100,
            })).rejects.toThrow(common_1.BadRequestException);
        });
        it('should trade NGN to USD successfully', async () => {
            jest.spyOn(fxService, 'getRate').mockResolvedValue(0.00065);
            mockEntityManager.findOne.mockResolvedValue(mockWallet);
            mockQueryBuilder.getOne.mockResolvedValue({ ...mockBalance, balance: '100000.00000000' });
            mockEntityManager.save.mockImplementation((entity, data) => Promise.resolve(data));
            mockEntityManager.create.mockImplementation((entity, data) => data);
            await service.trade('user-uuid', {
                fromCurrency: currency_enum_1.Currency.NGN,
                toCurrency: currency_enum_1.Currency.USD,
                amount: 1000,
            });
            expect(fxService.getRate).toHaveBeenCalledWith(currency_enum_1.Currency.NGN, currency_enum_1.Currency.USD);
        });
    });
});
//# sourceMappingURL=wallet.service.spec.js.map