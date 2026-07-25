import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JwtGuard } from './common/guards/jwt.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { MembersModule } from './members/members.module';
import { PackagesModule } from './packages/packages.module';
import { PackageCategoriesModule } from './package-categories/package-categories.module';
import { TrainersModule } from './trainers/trainers.module';
import { GymModule } from './gym/gym.module';

@Module({
  imports: [PrismaModule, AuthModule, MembersModule, PackagesModule, PackageCategoriesModule, TrainersModule, GymModule],
  controllers: [AppController],
  providers: [
    AppService,
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
