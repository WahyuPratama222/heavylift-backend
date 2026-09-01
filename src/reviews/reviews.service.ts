import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { PublishReviewDto } from './dto/publish-review.dto';
import { handlePrismaError } from '../common/helpers/prisma-error.helper';
import { FindReviewsDto } from './dto/find-review.dto';
import { paginate } from '../common/utils/paginate.util';
import { resolveMemberId } from '../common/helpers/resolve-member.helper';

const REVIEW_WINDOW_DAYS = 14;

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateReviewDto) {
    const memberId = await resolveMemberId(this.prisma, userId);

    const memberPackage = await this.prisma.memberPackage.findUnique({
      where: { id: dto.member_package_id },
    });

    if (!memberPackage) {
      throw new NotFoundException('Member package not found');
    }

    if (memberPackage.member_id !== memberId) {
      throw new ForbiddenException(
        'You cannot review a member package that belongs to someone else',
      );
    }

    const now = new Date();
    const endDate = new Date(memberPackage.end_date);
    const windowEnd = new Date(endDate);
    windowEnd.setDate(windowEnd.getDate() + REVIEW_WINDOW_DAYS);

    if (now < endDate) {
      throw new BadRequestException(
        'Review can only be submitted after the package has ended',
      );
    }

    if (now > windowEnd) {
      throw new BadRequestException(
        `Review window has passed (maximum ${REVIEW_WINDOW_DAYS} days after the package ends)`,
      );
    }

    try {
      return await this.prisma.review.create({
        data: {
          member_id: memberId,
          member_package_id: dto.member_package_id,
          rating: dto.rating,
          comment: dto.comment,
        },
      });
    } catch (error) {
      handlePrismaError(error, 'This member package has already been reviewed');
    }
  }

  async findPublished(query: FindReviewsDto) {
    return paginate(
      this.prisma,
      this.prisma.review,
      {
        where: { is_published: true },
        orderBy: { created_at: 'desc' },
        select: {
          id: true, rating: true, comment: true, created_at: true, updated_at: true,
          member: { select: { name: true, photo_url: true } },
          member_package: { select: { package: { select: { name: true } } } },
        },
      },
      query,
    );
  }

  async updatePublishStatus(id: string, dto: PublishReviewDto) {
    const review = await this.prisma.review.findUnique({ where: { id } });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return this.prisma.review.update({
      where: { id },
      data: { is_published: dto.is_published },
    });
  }
}