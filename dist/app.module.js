"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const cache_manager_1 = require("@nestjs/cache-manager");
const configuration_1 = require("./config/configuration");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const wallet_module_1 = require("./wallet/wallet.module");
const fx_module_1 = require("./fx/fx.module");
const transactions_module_1 = require("./transactions/transactions.module");
const mail_module_1 = require("./mail/mail.module");
const user_entity_1 = require("./users/user.entity");
const otp_entity_1 = require("./users/otp.entity");
const wallet_entity_1 = require("./wallet/entities/wallet.entity");
const wallet_balance_entity_1 = require("./wallet/entities/wallet-balance.entity");
const transaction_entity_1 = require("./transactions/transaction.entity");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [configuration_1.default],
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    type: 'postgres',
                    host: configService.get('database.host'),
                    port: configService.get('database.port'),
                    username: configService.get('database.username'),
                    password: configService.get('database.password'),
                    database: configService.get('database.database'),
                    entities: [user_entity_1.User, otp_entity_1.Otp, wallet_entity_1.Wallet, wallet_balance_entity_1.WalletBalance, transaction_entity_1.Transaction],
                    synchronize: configService.get('NODE_ENV') !== 'production',
                    logging: configService.get('NODE_ENV') === 'development',
                }),
            }),
            cache_manager_1.CacheModule.register({
                isGlobal: true,
                ttl: 300000,
            }),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            wallet_module_1.WalletModule,
            fx_module_1.FxModule,
            transactions_module_1.TransactionsModule,
            mail_module_1.MailModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map