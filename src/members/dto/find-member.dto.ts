import { IsOptional, IsIn } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class FindMembersDto extends PaginationDto {
  @IsOptional()
  search?: string;

  @IsOptional()
  @IsIn(['active', 'pending_payment', 'expired', 'no_package'])
  status?: string;

  @IsOptional()
  @IsIn(['male', 'female'])
  gender?: string;
}