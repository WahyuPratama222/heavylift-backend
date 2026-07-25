import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateGymScheduleDto } from '../dto/update-gym-schedule.dto';
import { Day } from '@prisma/client';

@Injectable()
export class GymSchedulesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.gymSchedule.findMany({
      orderBy: { day: 'asc' },
    });
  }

  async update(day: Day, dto: UpdateGymScheduleDto) {
    const schedule = await this.prisma.gymSchedule.findUnique({
      where: { day },
    });

    if (!schedule) {
      throw new NotFoundException(`Schedule for ${day} not found`);
    }

    return this.prisma.gymSchedule.update({
      where: { day },
      data: dto,
    });
  }
}