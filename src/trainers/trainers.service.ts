import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTrainerDto } from './dto/create-trainer.dto';
import { UpdateTrainerDto } from './dto/update-trainer.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { paginate } from '../common/utils/paginate.util';
import { deletedResponse } from '../common/utils/deleted-response.util';

@Injectable()
export class TrainersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTrainerDto) {
    return this.prisma.trainer.create({
      data: dto,
    });
  }

  async findAll(query: PaginationDto) {
    return paginate(
      this.prisma,
      this.prisma.trainer,
      { where: { is_active: true }, orderBy: { created_at: 'desc' } },
      query,
    );
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

    return deletedResponse('Trainer');
  }
}