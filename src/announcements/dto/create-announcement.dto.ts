import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsUUID,
  IsDateString,
  ValidateIf,
} from 'class-validator';
import { AnnouncementTarget } from '@prisma/client';

export class CreateAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(AnnouncementTarget)
  target: AnnouncementTarget;

  @ValidateIf((dto) => dto.target === 'specific_package')
  @IsUUID()
  @IsNotEmpty({ message: 'package_id is required when target is specific_package' })
  package_id?: string;

  @IsOptional()
  @IsDateString()
  published_at?: string;

  @IsOptional()
  @IsDateString()
  expired_at?: string;
}