import { IsString, IsOptional, IsIn } from 'class-validator';

export class XenditWebhookDto {
  @IsString()
  id: string;

  @IsIn(['PAID', 'EXPIRED', 'PENDING'])
  status: string;

  @IsOptional()
  @IsString()
  payment_method?: string;

  @IsOptional()
  @IsString()
  paid_at?: string;
}