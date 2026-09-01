import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateGymSettingDto } from '../dto/update-gym-setting.dto';

@Injectable()
export class GymSettingsService {
  constructor(private prisma: PrismaService) {}

  private readonly GYM_SETTINGS_ID = 'gym-settings-singleton';

  async update(dto: UpdateGymSettingDto) {
    return this.prisma.gymSetting.upsert({
      where: { id: this.GYM_SETTINGS_ID },
      update: dto,
      create: {
        id: this.GYM_SETTINGS_ID,
        ...dto,
        gym_name: dto.gym_name ?? 'HeavyLift Gym',
      },
    });
  }

  async findOne() {
    const settings = await this.prisma.gymSetting.findUnique({
      where: { id: this.GYM_SETTINGS_ID },
    });

    if (!settings) throw new NotFoundException('Gym settings not found');

    return settings;
  }
}