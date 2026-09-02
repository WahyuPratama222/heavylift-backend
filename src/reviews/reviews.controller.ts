import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { PublishReviewDto } from './dto/publish-review.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IUser } from '../common/interfaces/user.interface';
import { FindReviewsDto } from './dto/find-review.dto';
import { OwnerEndpoint } from '../common/decorators/owner-endpoint.decorator';
import { MemberEndpoint } from '../common/decorators/member-endpoint.decorator';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @ApiOperation({
    summary: 'Submit a review for a completed package (member only)',
    description:
      'Only allowed within a 14-day window after the package end_date. One review per member package.',
  })
  @ApiResponse({ status: 201, description: 'Review submitted successfully' })
  @ApiResponse({ status: 400, description: 'Package has not ended yet, or the review window has passed' })
  @ApiResponse({ status: 403, description: 'This member package belongs to someone else' })
  @ApiResponse({ status: 404, description: 'Member package not found' })
  @ApiResponse({ status: 409, description: 'This member package has already been reviewed' })
  @MemberEndpoint()
  @Post()
  create(@CurrentUser() user: IUser, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(user.id, dto);
  }

  @ApiOperation({ summary: 'List published reviews (public)' })
  @ApiResponse({ status: 200, description: 'Paginated list of published reviews' })
  @Public()
  @Get()
  findPublished(@Query() query: FindReviewsDto) {
    return this.reviewsService.findPublished(query);
  }

  @ApiOperation({ summary: 'Toggle a review\'s publish status (owner only)' })
  @ApiResponse({ status: 200, description: 'Publish status updated successfully' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  @OwnerEndpoint()
  @Patch(':id/publish')
  updatePublishStatus(
    @Param('id') id: string,
    @Body() dto: PublishReviewDto,
  ) {
    return this.reviewsService.updatePublishStatus(id, dto);
  }
}