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
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MembersService } from './members.service';
import { UpdateMemberDto } from './dto/update-member.dto';
import { UpdatePhotoDto } from './dto/update-photo.dto';
import { FindMembersDto } from './dto/find-member.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IUser } from '../common/interfaces/user.interface';
import { OwnerEndpoint } from '../common/decorators/owner-endpoint.decorator';
import { MemberEndpoint } from '../common/decorators/member-endpoint.decorator';

@ApiTags('Members')
@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  // member - profile
  @ApiOperation({ summary: "Get the current member's own profile" })
  @ApiResponse({ status: 200, description: 'Member profile' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  @MemberEndpoint()
  @Get('profile')
  getProfile(@CurrentUser() user: IUser) {
    return this.membersService.getProfile(user.id);
  }

  // member - update profile
  @ApiOperation({ summary: "Update the current member's own profile" })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  @MemberEndpoint()
  @Patch('profile')
  updateProfile(@CurrentUser() user: IUser, @Body() dto: UpdateMemberDto) {
    return this.membersService.updateProfile(user.id, dto);
  }

  // member - update photo
  @ApiOperation({ summary: "Update the current member's own profile photo" })
  @ApiResponse({ status: 200, description: 'Photo updated successfully' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  @MemberEndpoint()
  @Put('profile/photo')
  updatePhoto(@CurrentUser() user: IUser, @Body() dto: UpdatePhotoDto) {
    return this.membersService.updatePhoto(user.id, dto);
  }

  // owner - list semua member
  @ApiOperation({
    summary: 'List all members (owner only)',
    description: 'Supports filtering by name search, package status, and gender.',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of members' })
  @OwnerEndpoint()
  @Get()
  findAll(@Query() query: FindMembersDto) {
    return this.membersService.findAll(query);
  }

  // owner - detail 1 member
  @ApiOperation({ summary: 'Get a single member by id, including package/payment history (owner only)' })
  @ApiResponse({ status: 200, description: 'Member details' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  @OwnerEndpoint()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.membersService.findOne(id);
  }

  // owner - soft delete member
  @ApiOperation({ summary: 'Soft-delete a member (owner only)' })
  @ApiResponse({ status: 200, description: 'Member deleted successfully' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  @OwnerEndpoint()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.membersService.remove(id);
  }
}