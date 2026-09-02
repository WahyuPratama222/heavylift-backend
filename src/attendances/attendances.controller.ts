import { Controller, Get, Post, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AttendancesService } from './attendances.service';
import { FindAttendancesDto } from './dto/find-attendance.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IUser } from '../common/interfaces/user.interface';
import { PaginationDto } from '../common/dto/pagination.dto';
import { OwnerEndpoint } from '../common/decorators/owner-endpoint.decorator';
import { MemberEndpoint } from '../common/decorators/member-endpoint.decorator';

@ApiTags('Attendances')
@Controller('attendances')
export class AttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  @ApiOperation({ summary: 'Check in to the gym (member only)' })
  @ApiResponse({ status: 201, description: 'Checked in successfully' })
  @ApiResponse({ status: 403, description: 'Member has no active package' })
  @ApiResponse({ status: 409, description: 'Member already has an active session' })
  @MemberEndpoint()
  @Post('check-in')
  checkIn(@CurrentUser() user: IUser) {
    return this.attendancesService.checkIn(user.id);
  }

  @ApiOperation({ summary: 'Check out from the gym (member only)' })
  @ApiResponse({ status: 200, description: 'Checked out successfully' })
  @ApiResponse({ status: 404, description: 'No active session found' })
  @MemberEndpoint()
  @Post('check-out')
  @HttpCode(HttpStatus.OK)
  checkOut(@CurrentUser() user: IUser) {
    return this.attendancesService.checkOut(user.id);
  }

  @ApiOperation({ summary: "Get the current member's active session status" })
  @ApiResponse({ status: 200, description: 'Active session, or null if not checked in' })
  @MemberEndpoint()
  @Get('status')
  getStatus(@CurrentUser() user: IUser) {
    return this.attendancesService.getStatus(user.id);
  }

  @ApiOperation({ summary: "Get the current member's attendance history" })
  @ApiResponse({ status: 200, description: 'Paginated attendance history' })
  @Get('my')
  @MemberEndpoint()
  findMyHistory(@CurrentUser() user: IUser, @Query() query: PaginationDto) {
    return this.attendancesService.findMyHistory(user.id, query);
  }

  @ApiOperation({
    summary: 'List all attendance records (owner only)',
    description: 'Supports filtering by member_id and a date_from/date_to range on check_in_at.',
  })
  @ApiResponse({ status: 200, description: 'Paginated attendance records' })
  @OwnerEndpoint()
  @Get()
  findAll(@Query() query: FindAttendancesDto) {
    return this.attendancesService.findAll(query);
  }
}