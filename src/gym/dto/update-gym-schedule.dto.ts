import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateGymScheduleDto {
  @IsString()
  @IsOptional()
  open_time?: string;

  @IsString()
  @IsOptional()
  close_time?: string;

  @IsBoolean()
  @IsOptional()
  is_closed?: boolean;
}