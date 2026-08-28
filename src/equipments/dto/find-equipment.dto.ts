import { IsString, IsOptional } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class FindEquipmentsDto extends PaginationDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  category?: string;
}