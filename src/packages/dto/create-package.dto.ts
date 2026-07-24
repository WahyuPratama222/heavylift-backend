import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreatePackageDto {
  @IsUUID()
  @IsNotEmpty()
  category_id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsInt()
  @Min(1)
  duration_days: number;

  @IsBoolean()
  @IsOptional()
  include_trainer?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  benefits?: string[];

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}