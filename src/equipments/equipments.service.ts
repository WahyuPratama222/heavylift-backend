import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { FindEquipmentsDto } from './dto/find-equipment.dto';
import { AddEquipmentPhotosDto } from './dto/add-equipment-photo.dto';
import { handlePrismaError } from '../common/helpers/prisma-error.helper';

const equipmentSelect = {
  id: true,
  name: true,
  description: true,
  category: true,
  condition: true,
  is_active: true,
  created_at: true,
  updated_at: true,
  photos: {
    select: { id: true, url: true, order: true },
    orderBy: { order: 'asc' as const },
  },
};

@Injectable()
export class EquipmentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateEquipmentDto) {
    try {
      return await this.prisma.equipment.create({
        data: dto,
        select: equipmentSelect,
      });
    } catch (e) {
      handlePrismaError(e, 'Equipment already exists');
    }
  }

  async findAll(query: FindEquipmentsDto) {
    return this.prisma.equipment.findMany({
      where: {
        is_active: true,
        ...(query.search && {
          name: { contains: query.search, mode: 'insensitive' as const },
        }),
        ...(query.category && { category: query.category }),
      },
      select: equipmentSelect,
    });
  }

  async findOne(id: string) {
    const equipment = await this.prisma.equipment.findUnique({
      where: { id },
      select: equipmentSelect,
    });

    if (!equipment) {
      throw new NotFoundException('Equipment not found');
    }

    return equipment;
  }

  async update(id: string, dto: UpdateEquipmentDto) {
    await this.findOne(id);

    try {
      return await this.prisma.equipment.update({
        where: { id },
        data: dto,
        select: equipmentSelect,
      });
    } catch (e) {
      handlePrismaError(e, 'Equipment already exists');
    }
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.equipment.delete({ where: { id } });

    return { message: 'Equipment deleted successfully' };
  }

  async addPhotos(equipmentId: string, dto: AddEquipmentPhotosDto) {
    await this.findOne(equipmentId);

    const maxOrder = await this.prisma.equipmentPhoto.aggregate({
      where: { equipment_id: equipmentId },
      _max: { order: true },
    });
    const startOrder = (maxOrder._max.order ?? -1) + 1;

    return this.prisma.$transaction(
      dto.photo_urls.map((url, i) =>
        this.prisma.equipmentPhoto.create({
          data: {
            equipment_id: equipmentId,
            url,
            order: startOrder + i,
          },
        }),
      ),
    );
  }

  async removePhoto(equipmentId: string, photoId: string) {
    const photo = await this.prisma.equipmentPhoto.findUnique({
      where: { id: photoId },
    });

    if (!photo || photo.equipment_id !== equipmentId) {
      throw new NotFoundException('Photo not found for this equipment');
    }

    await this.prisma.equipmentPhoto.delete({ where: { id: photoId } });

    return { message: 'Photo deleted successfully' };
  }
}