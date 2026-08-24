import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JwtGuard } from './common/guards/jwt.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { MembersModule } from './members/members.module';
import { PackagesModule } from './packages/packages.module';
import { PackageCategoriesModule } from './package-categories/package-categories.module';
import { TrainersModule } from './trainers/trainers.module';
import { GymModule } from './gym/gym.module';
import { EquipmentsModule } from './equipments/equipments.module';
import { AttendancesModule } from './attendances/attendances.module';
import { RedisModule } from './redis/redis.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { HealthModule } from './health/health.module';
import { ReviewsModule } from './reviews/reviews.module';

@Module({
  imports: [PrismaModule, RedisModule, AuthModule, HealthModule, ReviewsModule, MembersModule, PackagesModule, PackageCategoriesModule, TrainersModule, GymModule, EquipmentsModule, AttendancesModule, AnnouncementsModule, ReviewsModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
