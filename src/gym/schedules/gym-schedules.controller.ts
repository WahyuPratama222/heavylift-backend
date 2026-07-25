import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Patch,
} from '@nestjs/common';
import { GymSchedulesService } from './gym-schedules.service';
import { UpdateGymScheduleDto } from '../dto/update-gym-schedule.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Day } from '@prisma/client';

@Controller('gym/schedules')
export class GymSchedulesController {
  constructor(private readonly gymSchedulesService: GymSchedulesService) {}

  @Public()
  @Get()
  findAll() {
    return this.gymSchedulesService.findAll();
  }

  @Roles('owner')
  @Patch(':day')
  update(
    @Param('day', new ParseEnumPipe(Day)) day: Day,
    @Body() dto: UpdateGymScheduleDto,
  ) {
    return this.gymSchedulesService.update(day, dto);
  }
}