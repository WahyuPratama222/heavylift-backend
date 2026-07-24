import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTrainerDto } from './dto/create-trainer.dto';
import { UpdateTrainerDto } from './dto/update-trainer.dto';

@Injectable()
export class TrainersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTrainerDto) {
    return this.prisma.trainer.create({
      data: dto,
    });
  }

  async findAll() {
    return this.prisma.trainer.findMany({
      where: { is_active: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string) {
    const trainer = await this.prisma.trainer.findUnique({
      where: { id },
    });

    if (!trainer) throw new NotFoundException('Trainer not found');

    return trainer;
  }

  async update(id: string, dto: UpdateTrainerDto) {
    await this.findOne(id);

    return this.prisma.trainer.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.trainer.delete({ where: { id } });

    return { message: 'Trainer deleted successfully' };
  }
}