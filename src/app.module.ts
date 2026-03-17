import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import configuration from './config/configuration';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WalletModule } from './wallet/wallet.module';
import { FxModule } from './fx/fx.module';
import { TransactionsModule } from './transactions/transactions.module';
import { MailModule } from './mail/mail.module';
import { User } from './users/user.entity';
import { Otp } from './users/otp.entity';
import { Wallet } from './wallet/entities/wallet.entity';
import { WalletBalance } from './wallet/entities/wallet-balance.entity';
import { Transaction } from './transactions/transaction.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        entities: [User, Otp, Wallet, WalletBalance, Transaction],
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 300000, // 5 minutes default (ms)
    }),
    AuthModule,
    UsersModule,
    WalletModule,
    FxModule,
    TransactionsModule,
    MailModule,
  ],
})
export class AppModule {}
