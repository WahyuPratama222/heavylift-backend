// attendances.controller.ts
import { Controller, Get, Post, Query } from '@nestjs/common';
import { AttendancesService } from './attendances.service';
import { FindAttendancesDto } from './dto/find-attendance.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IUser } from '../common/interfaces/user.interface';

@Controller('attendances')
export class AttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  @Post('check-in')
  @Roles('member')
  checkIn(@CurrentUser() user: IUser) {
    return this.attendancesService.checkIn(user.id);
  }

  @Post('check-out')
  @Roles('member')
  checkOut(@CurrentUser() user: IUser) {
    return this.attendancesService.checkOut(user.id);
  }

  @Get('status')
  @Roles('member')
  getStatus(@CurrentUser() user: IUser) {
    return this.attendancesService.getStatus(user.id);
  }

  @Get('my')
  @Roles('member')
  findMyHistory(@CurrentUser() user: IUser) {
    return this.attendancesService.findMyHistory(user.id);
  }

  @Get()
  @Roles('owner')
  findAll(@Query() query: FindAttendancesDto) {
    return this.attendancesService.findAll(query);
  }
}