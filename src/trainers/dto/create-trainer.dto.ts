import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUrl} from 'class-validator';

export class CreateTrainerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUrl()
  @IsOptional()
  photo_url?: string;

  @IsString()
  @IsOptional()
  specialization?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}