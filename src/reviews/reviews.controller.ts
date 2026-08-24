import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { PublishReviewDto } from './dto/publish-review.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Roles('member')
  @Post()
  create(@CurrentUser('id') memberId: string, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(memberId, dto);
  }

  @Public()
  @Get()
  findPublished() {
    return this.reviewsService.findPublished();
  }

  @Roles('owner')
  @Patch(':id/publish')
  updatePublishStatus(
    @Param('id') id: string,
    @Body() dto: PublishReviewDto,
  ) {
    return this.reviewsService.updatePublishStatus(id, dto);
  }
}