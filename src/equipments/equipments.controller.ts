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
import { EquipmentsService } from './equipments.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { FindEquipmentsDto } from './dto/find-equipment.dto';
import { AddEquipmentPhotosDto } from './dto/add-equipment-photo.dto';
import { Public } from '../common/decorators/public.decorator';
import { OwnerEndpoint } from '../common/decorators/owner-endpoint.decorator';

@ApiTags('Equipments')
@Controller('equipments')
export class EquipmentsController {
  constructor(private readonly equipmentsService: EquipmentsService) {}

  @ApiOperation({ summary: 'Create new equipment (owner only)' })
  @ApiResponse({ status: 201, description: 'Equipment created successfully' })
  @ApiResponse({ status: 409, description: 'Equipment with this name already exists' })
  @OwnerEndpoint()
  @Post()
  create(@Body() dto: CreateEquipmentDto) {
    return this.equipmentsService.create(dto);
  }

  @ApiOperation({ summary: 'List active equipments (public)' })
  @ApiResponse({ status: 200, description: 'Paginated list of equipments' })
  @Public()
  @Get()
  findAll(@Query() query: FindEquipmentsDto) {
    return this.equipmentsService.findAll(query);
  }

  @ApiOperation({ summary: 'Get a single equipment by id (public)' })
  @ApiResponse({ status: 200, description: 'Equipment details' })
  @ApiResponse({ status: 404, description: 'Equipment not found' })
  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.equipmentsService.findOne(id);
  }

  @ApiOperation({ summary: 'Update equipment (owner only)' })
  @ApiResponse({ status: 200, description: 'Equipment updated successfully' })
  @ApiResponse({ status: 404, description: 'Equipment not found' })
  @ApiResponse({ status: 409, description: 'Equipment with this name already exists' })
  @OwnerEndpoint()
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEquipmentDto) {
    return this.equipmentsService.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete equipment (owner only)' })
  @ApiResponse({ status: 200, description: 'Equipment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Equipment not found' })
  @OwnerEndpoint()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.equipmentsService.remove(id);
  }

  @ApiOperation({ summary: 'Add photos to an equipment (owner only)' })
  @ApiResponse({ status: 201, description: 'Photos added successfully' })
  @ApiResponse({ status: 404, description: 'Equipment not found' })
  @OwnerEndpoint()
  @Post(':id/photos')
  addPhotos(
    @Param('id') id: string,
    @Body() dto: AddEquipmentPhotosDto,
  ) {
    return this.equipmentsService.addPhotos(id, dto);
  }

  @ApiOperation({ summary: 'Remove a photo from an equipment (owner only)' })
  @ApiResponse({ status: 200, description: 'Photo deleted successfully' })
  @ApiResponse({ status: 404, description: 'Photo not found for this equipment' })
  @OwnerEndpoint()
  @Delete(':id/photos/:photoId')
  removePhoto(
    @Param('id') id: string,
    @Param('photoId') photoId: string,
  ) {
    return this.equipmentsService.removePhoto(id, photoId);
  }
}