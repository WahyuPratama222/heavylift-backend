import { IsOptional, IsIn, IsNumberString } from 'class-validator';

export class FindMembersDto {
  @IsOptional()
  search?: string;

  @IsOptional()
  @IsIn(['active', 'pending_payment', 'expired', 'no_package'])
  status?: string;

  @IsOptional()
  @IsIn(['male', 'female'])
  gender?: string;

  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;
}