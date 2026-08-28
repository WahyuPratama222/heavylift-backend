import { IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class FindPackagesDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  category_id?: string;
}