import { IsEmail, IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateGymSettingDto {
  @IsString()
  @IsOptional()
  gym_name?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsUrl()
  @IsOptional()
  logo_url?: string;

  @IsUrl()
  @IsOptional()
  instagram_url?: string;

  @IsUrl()
  @IsOptional()
  facebook_url?: string;

  @IsUrl()
  @IsOptional()
  tiktok_url?: string;
}