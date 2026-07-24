import {
  Controller,
  Get,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { MembersService } from './members.service';
import { UpdateMemberDto } from './dto/update-member.dto';
import { UpdatePhotoDto } from './dto/update-photo.dto';
import { FindMembersDto } from './dto/find-member.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IUser } from '../common/interfaces/user.interface';

@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  // member - profile
  @Roles('member')
  @Get('profile')
  getProfile(@CurrentUser() user: IUser) {
    return this.membersService.getProfile(user.id);
  }

  // member - update profile
  @Roles('member')
  @Patch('profile')
  updateProfile(@CurrentUser() user: IUser, @Body() dto: UpdateMemberDto) {
    return this.membersService.updateProfile(user.id, dto);
  }

  // member - update photo
  @Roles('member')
  @Put('profile/photo')
  updatePhoto(@CurrentUser() user: IUser, @Body() dto: UpdatePhotoDto) {
    return this.membersService.updatePhoto(user.id, dto);
  }

  // owner - list semua member
  @Roles('owner')
  @Get()
  findAll(@Query() query: FindMembersDto) {
    return this.membersService.findAll(
      query.search,
      query.status,
      query.gender,
      query.page ? parseInt(query.page) : 1,
      query.limit ? parseInt(query.limit) : 10,
    );
  }

  // owner - detail 1 member
  @Roles('owner')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.membersService.findOne(id);
  }

  // owner - soft delete member
  @Roles('owner')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.membersService.remove(id);
  }
}
