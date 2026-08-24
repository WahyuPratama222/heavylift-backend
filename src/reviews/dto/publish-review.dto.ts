import { IsBoolean } from 'class-validator';

export class PublishReviewDto {
  @IsBoolean()
  is_published: boolean;
}