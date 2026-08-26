import { Body, Controller, Get, Post } from '@nestjs/common';
import { MemberPackagesService } from './member-packages.service';
import { CreateMemberPackageDto } from './dto/create-member-package.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IUser } from '../common/interfaces/user.interface';

@Controller('member-packages')
export class MemberPackagesController {
  constructor(private readonly memberPackagesService: MemberPackagesService) {}

  @Roles('member')
  @Post()
  create(@CurrentUser() user: IUser, @Body() dto: CreateMemberPackageDto) {
    return this.memberPackagesService.create(user.id, user.email, dto);
  }

  @Roles('member')
  @Get('my')
  findMy(@CurrentUser() user: IUser) {
    return this.memberPackagesService.findMy(user.id);
  }

  @Roles('owner')
  @Get()
  findAll() {
    return this.memberPackagesService.findAll();
  }
}