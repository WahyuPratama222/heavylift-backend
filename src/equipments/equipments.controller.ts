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
import { EquipmentsService } from './equipments.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { FindEquipmentsDto } from './dto/find-equipment.dto';
import { AddEquipmentPhotosDto } from './dto/add-equipment-photo.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('equipments')
export class EquipmentsController {
  constructor(private readonly equipmentsService: EquipmentsService) {}

  @Post()
  @Roles('owner')
  create(@Body() dto: CreateEquipmentDto) {
    return this.equipmentsService.create(dto);
  }

  @Get()
  @Public()
  findAll(@Query() query: FindEquipmentsDto) {
    return this.equipmentsService.findAll(query);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.equipmentsService.findOne(id);
  }

  @Patch(':id')
  @Roles('owner')
  update(@Param('id') id: string, @Body() dto: UpdateEquipmentDto) {
    return this.equipmentsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('owner')
  remove(@Param('id') id: string) {
    return this.equipmentsService.remove(id);
  }

  @Post(':id/photos')
  @Roles('owner')
  addPhotos(
    @Param('id') id: string,
    @Body() dto: AddEquipmentPhotosDto,
  ) {
    return this.equipmentsService.addPhotos(id, dto);
  }

  @Delete(':id/photos/:photoId')
  @Roles('owner')
  removePhoto(
    @Param('id') id: string,
    @Param('photoId') photoId: string,
  ) {
    return this.equipmentsService.removePhoto(id, photoId);
  }
}