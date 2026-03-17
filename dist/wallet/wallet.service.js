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
var WalletService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const wallet_entity_1 = require("./entities/wallet.entity");
const wallet_balance_entity_1 = require("./entities/wallet-balance.entity");
const transaction_entity_1 = require("../transactions/transaction.entity");
const fx_service_1 = require("../fx/fx.service");
const currency_enum_1 = require("../common/enums/currency.enum");
const transaction_type_enum_1 = require("../common/enums/transaction-type.enum");
let WalletService = WalletService_1 = class WalletService {
    constructor(walletRepository, walletBalanceRepository, transactionRepository, fxService, dataSource) {
        this.walletRepository = walletRepository;
        this.walletBalanceRepository = walletBalanceRepository;
        this.transactionRepository = transactionRepository;
        this.fxService = fxService;
        this.dataSource = dataSource;
        this.logger = new common_1.Logger(WalletService_1.name);
    }
    async createWallet(userId) {
        const wallet = this.walletRepository.create({
            userId,
            balances: [
                this.walletBalanceRepository.create({
                    currency: currency_enum_1.Currency.NGN,
                    balance: '0',
                }),
            ],
        });
        return this.walletRepository.save(wallet);
    }
    async getWallet(userId) {
        const wallet = await this.walletRepository.findOne({
            where: { userId },
            relations: ['balances'],
        });
        if (!wallet) {
            throw new common_1.NotFoundException('Wallet not found');
        }
        return wallet;
    }
    async fundWallet(userId, dto) {
        if (dto.idempotencyKey) {
            const existing = await this.transactionRepository.findOne({
                where: { reference: dto.idempotencyKey, userId },
            });
            if (existing) {
                return existing;
            }
        }
        return this.dataSource.transaction(async (manager) => {
            const wallet = await manager.findOne(wallet_entity_1.Wallet, {
                where: { userId },
                lock: { mode: 'pessimistic_write' },
                loadEagerRelations: false,
            });
            if (!wallet) {
                throw new common_1.NotFoundException('Wallet not found');
            }
            const balance = await this.getOrCreateBalance(manager, wallet.id, dto.currency);
            balance.balance = (parseFloat(balance.balance) + dto.amount).toFixed(8);
            await manager.save(wallet_balance_entity_1.WalletBalance, balance);
            const transaction = manager.create(transaction_entity_1.Transaction, {
                userId,
                type: transaction_type_enum_1.TransactionType.FUNDING,
                toCurrency: dto.currency,
                toAmount: dto.amount.toString(),
                status: transaction_type_enum_1.TransactionStatus.COMPLETED,
                reference: dto.idempotencyKey || (0, uuid_1.v4)(),
                description: `Wallet funded with ${dto.amount} ${dto.currency}`,
            });
            return manager.save(transaction_entity_1.Transaction, transaction);
        });
    }
    async convert(userId, dto) {
        if (dto.fromCurrency === dto.toCurrency) {
            throw new common_1.BadRequestException('Source and target currencies must be different');
        }
        const rate = await this.fxService.getRate(dto.fromCurrency, dto.toCurrency);
        const toAmount = parseFloat((dto.amount * rate).toFixed(8));
        return this.dataSource.transaction(async (manager) => {
            const wallet = await manager.findOne(wallet_entity_1.Wallet, {
                where: { userId },
                lock: { mode: 'pessimistic_write' },
                loadEagerRelations: false,
            });
            if (!wallet) {
                throw new common_1.NotFoundException('Wallet not found');
            }
            const fromBalance = await this.getLockedBalance(manager, wallet.id, dto.fromCurrency);
            const currentFromBalance = parseFloat(fromBalance?.balance || '0');
            if (!fromBalance || currentFromBalance < dto.amount) {
                throw new common_1.BadRequestException(`Insufficient ${dto.fromCurrency} balance. Available: ${currentFromBalance.toFixed(2)}, Required: ${dto.amount}`);
            }
            fromBalance.balance = (currentFromBalance - dto.amount).toFixed(8);
            await manager.save(wallet_balance_entity_1.WalletBalance, fromBalance);
            const toBalance = await this.getOrCreateBalance(manager, wallet.id, dto.toCurrency);
            toBalance.balance = (parseFloat(toBalance.balance) + toAmount).toFixed(8);
            await manager.save(wallet_balance_entity_1.WalletBalance, toBalance);
            const transaction = manager.create(transaction_entity_1.Transaction, {
                userId,
                type: transaction_type_enum_1.TransactionType.CONVERSION,
                fromCurrency: dto.fromCurrency,
                toCurrency: dto.toCurrency,
                fromAmount: dto.amount.toString(),
                toAmount: toAmount.toString(),
                rate: rate.toString(),
                status: transaction_type_enum_1.TransactionStatus.COMPLETED,
                reference: (0, uuid_1.v4)(),
                description: `Converted ${dto.amount} ${dto.fromCurrency} to ${toAmount} ${dto.toCurrency} @ ${rate}`,
            });
            return manager.save(transaction_entity_1.Transaction, transaction);
        });
    }
    async trade(userId, dto) {
        if (dto.fromCurrency !== currency_enum_1.Currency.NGN && dto.toCurrency !== currency_enum_1.Currency.NGN) {
            throw new common_1.BadRequestException('Trade must involve NGN. Use /wallet/convert for cross-currency conversions.');
        }
        if (dto.fromCurrency === dto.toCurrency) {
            throw new common_1.BadRequestException('Source and target currencies must be different');
        }
        const rate = await this.fxService.getRate(dto.fromCurrency, dto.toCurrency);
        const toAmount = parseFloat((dto.amount * rate).toFixed(8));
        return this.dataSource.transaction(async (manager) => {
            const wallet = await manager.findOne(wallet_entity_1.Wallet, {
                where: { userId },
                lock: { mode: 'pessimistic_write' },
                loadEagerRelations: false,
            });
            if (!wallet) {
                throw new common_1.NotFoundException('Wallet not found');
            }
            const fromBalance = await this.getLockedBalance(manager, wallet.id, dto.fromCurrency);
            const currentFromBalance = parseFloat(fromBalance?.balance || '0');
            if (!fromBalance || currentFromBalance < dto.amount) {
                throw new common_1.BadRequestException(`Insufficient ${dto.fromCurrency} balance. Available: ${currentFromBalance.toFixed(2)}, Required: ${dto.amount}`);
            }
            fromBalance.balance = (currentFromBalance - dto.amount).toFixed(8);
            await manager.save(wallet_balance_entity_1.WalletBalance, fromBalance);
            const toBalance = await this.getOrCreateBalance(manager, wallet.id, dto.toCurrency);
            toBalance.balance = (parseFloat(toBalance.balance) + toAmount).toFixed(8);
            await manager.save(wallet_balance_entity_1.WalletBalance, toBalance);
            const transaction = manager.create(transaction_entity_1.Transaction, {
                userId,
                type: transaction_type_enum_1.TransactionType.TRADE,
                fromCurrency: dto.fromCurrency,
                toCurrency: dto.toCurrency,
                fromAmount: dto.amount.toString(),
                toAmount: toAmount.toString(),
                rate: rate.toString(),
                status: transaction_type_enum_1.TransactionStatus.COMPLETED,
                reference: (0, uuid_1.v4)(),
                description: `Traded ${dto.amount} ${dto.fromCurrency} for ${toAmount} ${dto.toCurrency} @ ${rate}`,
            });
            return manager.save(transaction_entity_1.Transaction, transaction);
        });
    }
    async getOrCreateBalance(manager, walletId, currency) {
        let balance = await manager.findOne(wallet_balance_entity_1.WalletBalance, {
            where: { walletId, currency },
        });
        if (!balance) {
            balance = manager.create(wallet_balance_entity_1.WalletBalance, {
                walletId,
                currency,
                balance: '0',
            });
        }
        return balance;
    }
    async getLockedBalance(manager, walletId, currency) {
        return manager
            .getRepository(wallet_balance_entity_1.WalletBalance)
            .createQueryBuilder('wb')
            .setLock('pessimistic_write')
            .where('wb.walletId = :walletId AND wb.currency = :currency', {
            walletId,
            currency,
        })
            .getOne();
    }
};
exports.WalletService = WalletService;
exports.WalletService = WalletService = WalletService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(wallet_entity_1.Wallet)),
    __param(1, (0, typeorm_1.InjectRepository)(wallet_balance_entity_1.WalletBalance)),
    __param(2, (0, typeorm_1.InjectRepository)(transaction_entity_1.Transaction)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        fx_service_1.FxService,
        typeorm_2.DataSource])
], WalletService);
//# sourceMappingURL=wallet.service.js.map