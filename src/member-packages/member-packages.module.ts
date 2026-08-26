import { Module } from '@nestjs/common';
import { MemberPackagesService } from './member-packages.service';
import { MemberPackagesController } from './member-packages.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { XenditModule } from '../xendit/xendit.module';

@Module({
  imports: [PrismaModule, XenditModule],
  controllers: [MemberPackagesController],
  providers: [MemberPackagesService],
})
export class MemberPackagesModule {}