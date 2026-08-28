import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { MemberPackagesService } from './member-packages.service';
import { CreateMemberPackageDto } from './dto/create-member-package.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IUser } from '../common/interfaces/user.interface';
import { PaginationDto } from '../common/dto/pagination.dto';

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
  findMy(@CurrentUser() user: IUser, @Query() query: PaginationDto) {
    return this.memberPackagesService.findMy(user.id, query);
  }

  @Roles('owner')
  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.memberPackagesService.findAll(query);
  }
}