import { IsString, IsOptional } from 'class-validator';

export class FindEquipmentsDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  category?: string;
}