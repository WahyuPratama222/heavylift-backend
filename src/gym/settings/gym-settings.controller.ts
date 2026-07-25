import { Body, Controller, Get, Patch } from '@nestjs/common';
import { GymSettingsService } from './gym-settings.service';
import { UpdateGymSettingDto } from '../dto/update-gym-setting.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('gym/settings')
export class GymSettingsController {
  constructor(private readonly gymSettingsService: GymSettingsService) {}

  @Public()
  @Get()
  findOne() {
    return this.gymSettingsService.findOne();
  }

  @Roles('owner')
  @Patch()
  update(@Body() dto: UpdateGymSettingDto) {
    return this.gymSettingsService.update(dto);
  }
}