import { IsString, IsOptional, IsDateString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class FindAttendancesDto extends PaginationDto {
  @IsString()
  @IsOptional()
  member_id?: string;

  @IsDateString()
  @IsOptional()
  date_from?: string;

  @IsDateString()
  @IsOptional()
  date_to?: string;
}