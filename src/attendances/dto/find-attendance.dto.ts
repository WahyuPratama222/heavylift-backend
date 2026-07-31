// find-attendances.dto.ts
import { IsString, IsOptional, IsDateString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class FindAttendancesDto {
  @IsString()
  @IsOptional()
  member_id?: string;

  @IsDateString()
  @IsOptional()
  date_from?: string;

  @IsDateString()
  @IsOptional()
  date_to?: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  limit?: number = 20;
}