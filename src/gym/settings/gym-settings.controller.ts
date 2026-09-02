import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GymSettingsService } from './gym-settings.service';
import { UpdateGymSettingDto } from '../dto/update-gym-setting.dto';
import { Public } from '../../common/decorators/public.decorator';
import { OwnerEndpoint } from '../../common/decorators/owner-endpoint.decorator';

@ApiTags('Gym')
@Controller('gym/settings')
export class GymSettingsController {
  constructor(private readonly gymSettingsService: GymSettingsService) {}

  @ApiOperation({ summary: 'Get current gym settings (public)' })
  @ApiResponse({ status: 200, description: 'Gym settings (name, address, contact info, etc.)' })
  @Public()
  @Get()
  findOne() {
    return this.gymSettingsService.findOne();
  }

  @ApiOperation({ summary: 'Update gym settings (owner only)' })
  @ApiResponse({ status: 200, description: 'Gym settings updated successfully' })
  @OwnerEndpoint()
  @Patch()
  update(@Body() dto: UpdateGymSettingDto) {
    return this.gymSettingsService.update(dto);
  }
}