import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateMemberPackageDto {
  @IsUUID()
  @IsNotEmpty()
  package_id: string;
}