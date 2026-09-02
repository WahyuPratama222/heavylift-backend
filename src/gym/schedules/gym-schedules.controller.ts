import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { GymSchedulesService } from './gym-schedules.service';
import { UpdateGymScheduleDto } from '../dto/update-gym-schedule.dto';
import { Public } from '../../common/decorators/public.decorator';
import { OwnerEndpoint } from '../../common/decorators/owner-endpoint.decorator';
import { Day } from '@prisma/client';

@ApiTags('Gym')
@Controller('gym/schedules')
export class GymSchedulesController {
  constructor(private readonly gymSchedulesService: GymSchedulesService) {}

  @ApiOperation({ summary: 'List all 7 days of gym operating hours (public)' })
  @ApiResponse({ status: 200, description: 'Weekly schedule, one entry per day' })
  @Public()
  @Get()
  findAll() {
    return this.gymSchedulesService.findAll();
  }

  @ApiOperation({ summary: 'Update operating hours for a specific day (owner only)' })
  @ApiParam({ name: 'day', enum: Day })
  @ApiResponse({ status: 200, description: 'Schedule updated successfully' })
  @ApiResponse({ status: 404, description: 'Schedule for that day not found' })
  @OwnerEndpoint()
  @Patch(':day')
  update(
    @Param('day', new ParseEnumPipe(Day)) day: Day,
    @Body() dto: UpdateGymScheduleDto,
  ) {
    return this.gymSchedulesService.update(day, dto);
  }
}