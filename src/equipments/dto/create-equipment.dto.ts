import { IsString, IsOptional, IsBoolean, IsEnum, IsNotEmpty } from 'class-validator';
import { EquipmentCondition } from '@prisma/client';

export class CreateEquipmentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsEnum(EquipmentCondition)
  @IsOptional()
  condition?: EquipmentCondition;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}