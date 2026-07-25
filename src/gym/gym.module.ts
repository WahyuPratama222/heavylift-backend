import { Module } from '@nestjs/common';
import { GymSettingsController } from './settings/gym-settings.controller';
import { GymSchedulesController } from './schedules/gym-schedules.controller';
import { GymSettingsService } from './settings/gym-settings.service';
import { GymSchedulesService } from './schedules/gym-schedules.service';

@Module({
  controllers: [GymSettingsController, GymSchedulesController],
  providers: [GymSettingsService, GymSchedulesService],
})
export class GymModule {}