import { Controller, Get, Post, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { AttendancesService } from './attendances.service';
import { FindAttendancesDto } from './dto/find-attendance.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IUser } from '../common/interfaces/user.interface';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('attendances')
export class AttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  @Roles('member')
  @Post('check-in')
  checkIn(@CurrentUser() user: IUser) {
    return this.attendancesService.checkIn(user.id);
  }

  @Roles('member')
  @Post('check-out')
  @HttpCode(HttpStatus.OK)
  checkOut(@CurrentUser() user: IUser) {
    return this.attendancesService.checkOut(user.id);
  }

  @Roles('member')
  @Get('status')
  getStatus(@CurrentUser() user: IUser) {
    return this.attendancesService.getStatus(user.id);
  }

  @Get('my')
  @Roles('member')
  findMyHistory(@CurrentUser() user: IUser, @Query() query: PaginationDto) {
    return this.attendancesService.findMyHistory(user.id, query);
  }

  @Roles('owner')
  @Get()
  findAll(@Query() query: FindAttendancesDto) {
    return this.attendancesService.findAll(query);
  }
}