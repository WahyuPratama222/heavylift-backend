import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';

import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { envValidationSchema } from './config/env.validation';
import { createLoggerConfig } from './config/logger.config';
import { JwtGuard } from './common/guards/jwt.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { MembersModule } from './members/members.module';
import { PackageCategoriesModule } from './package-categories/package-categories.module';
import { PackagesModule } from './packages/packages.module';
import { TrainersModule } from './trainers/trainers.module';
import { GymModule } from './gym/gym.module';
import { EquipmentsModule } from './equipments/equipments.module';
import { AttendancesModule } from './attendances/attendances.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { ReviewsModule } from './reviews/reviews.module';
import { XenditModule } from './xendit/xendit.module';
import { MemberPackagesModule } from './member-packages/member-packages.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'production' ? '.env.production' : '.env',
      validationSchema: envValidationSchema,
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: createLoggerConfig,
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    RedisModule,
    HealthModule,
    AuthModule,
    MembersModule,
    PackageCategoriesModule,
    PackagesModule,
    TrainersModule,
    GymModule,
    EquipmentsModule,
    AttendancesModule,
    AnnouncementsModule,
    ReviewsModule,
    XenditModule,
    MemberPackagesModule,
    PaymentsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}