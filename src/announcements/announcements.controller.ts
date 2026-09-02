import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { FindAnnouncementsDto } from './dto/find-announcement.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IUser } from '../common/interfaces/user.interface';
import { OwnerEndpoint } from '../common/decorators/owner-endpoint.decorator';
import { MemberEndpoint } from '../common/decorators/member-endpoint.decorator';

@ApiTags('Announcements')
@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @ApiOperation({ summary: 'Create a manual announcement (owner only)' })
  @ApiResponse({ status: 201, description: 'Announcement created successfully' })
  @OwnerEndpoint()
  @Post()
  create(@Body() dto: CreateAnnouncementDto) {
    return this.announcementsService.create(dto);
  }

  @ApiOperation({
    summary: 'List announcements relevant to the current member',
    description:
      'Returns published, non-expired announcements targeted at the member — either "all", or matched against their latest package status.',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of announcements' })
  @ApiResponse({ status: 404, description: 'Member profile not found' })
  @MemberEndpoint()
  @Get()
  findAll(@CurrentUser() user: IUser, @Query() query: FindAnnouncementsDto) {
    return this.announcementsService.findAll(user.id, query);
  }

  @ApiOperation({ summary: 'Update an announcement (owner only)' })
  @ApiResponse({ status: 200, description: 'Announcement updated successfully' })
  @ApiResponse({ status: 404, description: 'Announcement not found' })
  @OwnerEndpoint()
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAnnouncementDto) {
    return this.announcementsService.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete an announcement (owner only)' })
  @ApiResponse({ status: 200, description: 'Announcement deleted successfully' })
  @ApiResponse({ status: 404, description: 'Announcement not found' })
  @OwnerEndpoint()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.announcementsService.remove(id);
  }
}