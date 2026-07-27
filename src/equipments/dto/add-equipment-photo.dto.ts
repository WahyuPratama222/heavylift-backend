import { IsArray, IsUrl, ArrayMinSize } from 'class-validator';

export class AddEquipmentPhotosDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUrl({}, { each: true })
  photo_urls: string[];
}