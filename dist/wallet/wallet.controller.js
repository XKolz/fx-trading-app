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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const wallet_service_1 = require("./wallet.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const verified_guard_1 = require("../auth/guards/verified.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const user_entity_1 = require("../users/user.entity");
const fund_wallet_dto_1 = require("./dto/fund-wallet.dto");
const convert_dto_1 = require("./dto/convert.dto");
const trade_dto_1 = require("./dto/trade.dto");
let WalletController = class WalletController {
    constructor(walletService) {
        this.walletService = walletService;
    }
    getWallet(user) {
        return this.walletService.getWallet(user.id);
    }
    fundWallet(user, dto) {
        return this.walletService.fundWallet(user.id, dto);
    }
    convert(user, dto) {
        return this.walletService.convert(user.id, dto);
    }
    trade(user, dto) {
        return this.walletService.trade(user.id, dto);
    }
};
exports.WalletController = WalletController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get user wallet balances by currency' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Wallet with all currency balances' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User]),
    __metadata("design:returntype", void 0)
], WalletController.prototype, "getWallet", null);
__decorate([
    (0, common_1.Post)('fund'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Fund wallet in NGN or other currencies' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Wallet funded, transaction returned' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User, fund_wallet_dto_1.FundWalletDto]),
    __metadata("design:returntype", void 0)
], WalletController.prototype, "fundWallet", null);
__decorate([
    (0, common_1.Post)('convert'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Convert between currencies using real-time FX rates' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Conversion successful, transaction returned' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Insufficient balance or invalid currencies' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User, convert_dto_1.ConvertDto]),
    __metadata("design:returntype", void 0)
], WalletController.prototype, "convert", null);
__decorate([
    (0, common_1.Post)('trade'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Trade Naira (NGN) against other currencies and vice versa' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Trade successful, transaction returned' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Insufficient balance or trade must involve NGN' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User, trade_dto_1.TradeDto]),
    __metadata("design:returntype", void 0)
], WalletController.prototype, "trade", null);
exports.WalletController = WalletController = __decorate([
    (0, swagger_1.ApiTags)('wallet'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, verified_guard_1.VerifiedGuard),
    (0, common_1.Controller)('wallet'),
    __metadata("design:paramtypes", [wallet_service_1.WalletService])
], WalletController);
//# sourceMappingURL=wallet.controller.js.map