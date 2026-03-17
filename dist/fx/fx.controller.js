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
exports.FxController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const fx_service_1 = require("./fx.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const verified_guard_1 = require("../auth/guards/verified.guard");
const currency_enum_1 = require("../common/enums/currency.enum");
let FxController = class FxController {
    constructor(fxService) {
        this.fxService = fxService;
    }
    getRates(base) {
        if (base) {
            return this.fxService.getRates(base);
        }
        return this.fxService.getAllRates();
    }
};
exports.FxController = FxController;
__decorate([
    (0, common_1.Get)('rates'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current FX rates for supported currency pairs' }),
    (0, swagger_1.ApiQuery)({ name: 'base', enum: currency_enum_1.Currency, required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Current FX rates' }),
    __param(0, (0, common_1.Query)('base')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FxController.prototype, "getRates", null);
exports.FxController = FxController = __decorate([
    (0, swagger_1.ApiTags)('fx'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, verified_guard_1.VerifiedGuard),
    (0, common_1.Controller)('fx'),
    __metadata("design:paramtypes", [fx_service_1.FxService])
], FxController);
//# sourceMappingURL=fx.controller.js.map