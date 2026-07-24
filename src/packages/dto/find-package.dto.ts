import { IsOptional, IsUUID } from 'class-validator';

export class FindPackagesDto {
  @IsOptional()
  @IsUUID()
  category_id?: string;
}