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
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TrainersService } from './trainers.service';
import { CreateTrainerDto } from './dto/create-trainer.dto';
import { UpdateTrainerDto } from './dto/update-trainer.dto';
import { Public } from '../common/decorators/public.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { OwnerEndpoint } from '../common/decorators/owner-endpoint.decorator';

@ApiTags('Trainers')
@Controller('trainers')
export class TrainersController {
  constructor(private readonly trainersService: TrainersService) {}

  @ApiOperation({ summary: 'Create a trainer (owner only)' })
  @ApiResponse({ status: 201, description: 'Trainer created successfully' })
  @OwnerEndpoint()
  @Post()
  create(@Body() dto: CreateTrainerDto) {
    return this.trainersService.create(dto);
  }

  @ApiOperation({ summary: 'List active trainers (public)' })
  @ApiResponse({ status: 200, description: 'Paginated list of trainers' })
  @Public()
  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.trainersService.findAll(query);
  }

  @ApiOperation({ summary: 'Update a trainer (owner only)' })
  @ApiResponse({ status: 200, description: 'Trainer updated successfully' })
  @ApiResponse({ status: 404, description: 'Trainer not found' })
  @OwnerEndpoint()
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTrainerDto) {
    return this.trainersService.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete a trainer (owner only, hard delete)' })
  @ApiResponse({ status: 200, description: 'Trainer deleted successfully' })
  @ApiResponse({ status: 404, description: 'Trainer not found' })
  @OwnerEndpoint()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.trainersService.remove(id);
  }
}