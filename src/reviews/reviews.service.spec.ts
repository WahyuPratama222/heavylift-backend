import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let prisma: any;

  const memberId = 'member-1';
  const memberPackageId = 'mp-1';

  const makeMemberPackage = (overrides = {}) => ({
    id: memberPackageId,
    member_id: memberId,
    end_date: new Date('2026-08-01T00:00:00.000Z'),
    ...overrides,
  });

  beforeEach(async () => {
    prisma = {
      memberPackage: { findUnique: jest.fn() },
      review: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(ReviewsService);
    jest.resetAllMocks();
  });

  describe('create', () => {
    it('creates a review within a valid window', async () => {
      const memberPackage = makeMemberPackage();
      prisma.memberPackage.findUnique.mockResolvedValueOnce(memberPackage);
      prisma.review.create.mockResolvedValueOnce({ id: 'review-1' });

      jest.useFakeTimers().setSystemTime(new Date('2026-08-05T00:00:00.000Z'));

      const result = await service.create(memberId, {
        member_package_id: memberPackageId,
        rating: 5,
        comment: 'Great gym',
      });

      expect(result).toEqual({ id: 'review-1' });
      jest.useRealTimers();
    });

    it('throws NotFoundException when member package does not exist', async () => {
      prisma.memberPackage.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.create(memberId, {
          member_package_id: memberPackageId,
          rating: 5,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when member package belongs to someone else', async () => {
      prisma.memberPackage.findUnique.mockResolvedValueOnce(
        makeMemberPackage({ member_id: 'other-member' }),
      );

      await expect(
        service.create(memberId, {
          member_package_id: memberPackageId,
          rating: 5,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException when package has not ended yet', async () => {
      prisma.memberPackage.findUnique.mockResolvedValueOnce(
        makeMemberPackage({ end_date: new Date('2026-12-01T00:00:00.000Z') }),
      );

      jest.useFakeTimers().setSystemTime(new Date('2026-08-05T00:00:00.000Z'));

      await expect(
        service.create(memberId, {
          member_package_id: memberPackageId,
          rating: 5,
        }),
      ).rejects.toThrow(BadRequestException);

      jest.useRealTimers();
    });

    it('throws BadRequestException when the 14-day window has passed', async () => {
      prisma.memberPackage.findUnique.mockResolvedValueOnce(
        makeMemberPackage({ end_date: new Date('2026-06-01T00:00:00.000Z') }),
      );

      jest.useFakeTimers().setSystemTime(new Date('2026-08-05T00:00:00.000Z'));

      await expect(
        service.create(memberId, {
          member_package_id: memberPackageId,
          rating: 5,
        }),
      ).rejects.toThrow(BadRequestException);

      jest.useRealTimers();
    });

    it('throws ConflictException when member package has already been reviewed', async () => {
      prisma.memberPackage.findUnique.mockResolvedValueOnce(makeMemberPackage());

      jest.useFakeTimers().setSystemTime(new Date('2026-08-05T00:00:00.000Z'));

      prisma.review.create.mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: '5.0.0',
        }),
      );

      await expect(
        service.create(memberId, {
          member_package_id: memberPackageId,
          rating: 5,
        }),
      ).rejects.toThrow();

      jest.useRealTimers();
    });
  });

  describe('findPublished', () => {
    it('returns only published reviews', async () => {
      prisma.review.findMany.mockResolvedValueOnce([{ id: 'review-1' }]);

      const result = await service.findPublished();

      expect(prisma.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { is_published: true } }),
      );
      expect(result).toEqual([{ id: 'review-1' }]);
    });
  });

  describe('updatePublishStatus', () => {
    it('updates the publish status', async () => {
      prisma.review.findUnique.mockResolvedValueOnce({ id: 'review-1' });
      prisma.review.update.mockResolvedValueOnce({
        id: 'review-1',
        is_published: true,
      });

      const result = await service.updatePublishStatus('review-1', {
        is_published: true,
      });

      expect(result.is_published).toBe(true);
    });

    it('throws NotFoundException when review does not exist', async () => {
      prisma.review.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.updatePublishStatus('review-x', { is_published: true }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});