import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { TrainersService } from './trainers.service';
import { CreateTrainerDto } from './dto/create-trainer.dto';
import { UpdateTrainerDto } from './dto/update-trainer.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('trainers')
export class TrainersController {
  constructor(private readonly trainersService: TrainersService) {}

  @Roles('owner')
  @Post()
  create(@Body() dto: CreateTrainerDto) {
    return this.trainersService.create(dto);
  }

  @Public()
  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.trainersService.findAll(query);
  }

  @Roles('owner')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTrainerDto) {
    return this.trainersService.update(id, dto);
  }

  @Roles('owner')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.trainersService.remove(id);
  }
}