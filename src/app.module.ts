import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';
import appConfig from './config/app.config';
import jwtConfig from './config/jwt.config';
import sapConfig from './config/sap.config';
import apiAuthConfig from './config/api-auth.config';
import { winstonConfig } from './config/winston.config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SapModule } from './sap/sap.module';
import { CustomersModule } from './customers/customers.module';
import { CardsModule } from './cards/cards.module';
import { PointRefundsModule } from './point-refunds/point-refunds.module';
import { PointRedemptionsModule } from './point-redemptions/point-redemptions.module';
import { TransactionsModule } from './transactions/transactions.module';
import { StatementsModule } from './statements/statements.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig, sapConfig, apiAuthConfig],
      envFilePath: ['.env'],
    }),
    WinstonModule.forRoot(winstonConfig),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    SapModule,
    CustomersModule,
    CardsModule,
    PointRefundsModule,
    PointRedemptionsModule,
    TransactionsModule,
    StatementsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
