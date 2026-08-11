import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { AttendancesService } from './attendances.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AttendancesService', () => {
  let service: AttendancesService;

  const mockPrisma = {
    member: {
      findUnique: jest.fn(),
    },
    memberPackage: {
      findFirst: jest.fn(),
    },
    attendance: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockMember = { id: 'member-1', deleted_at: null };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendancesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AttendancesService>(AttendancesService);

    jest.resetAllMocks();
  });

  // ============ checkIn ============
  describe('checkIn', () => {
    it('should check in successfully', async () => {
      mockPrisma.member.findUnique.mockResolvedValue(mockMember);
      mockPrisma.memberPackage.findFirst.mockResolvedValue({
        id: 'mp-1',
        status: 'active',
      });
      mockPrisma.attendance.findFirst.mockResolvedValue(null);
      mockPrisma.attendance.create.mockResolvedValue({
        id: 'att-1',
        check_in_at: new Date(),
      });

      const result = await service.checkIn('user-1');

      expect(result.id).toBe('att-1');
    });

    it('should throw NotFoundException if member not found', async () => {
      mockPrisma.member.findUnique.mockResolvedValue(null);

      await expect(service.checkIn('user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if no active package', async () => {
      mockPrisma.member.findUnique.mockResolvedValue(mockMember);
      mockPrisma.memberPackage.findFirst.mockResolvedValue(null);

      await expect(service.checkIn('user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ConflictException if already has active session', async () => {
      mockPrisma.member.findUnique.mockResolvedValue(mockMember);
      mockPrisma.memberPackage.findFirst.mockResolvedValue({
        id: 'mp-1',
        status: 'active',
      });
      mockPrisma.attendance.findFirst.mockResolvedValue({
        id: 'att-existing',
        check_out_at: null,
      });

      await expect(service.checkIn('user-1')).rejects.toThrow(
        ConflictException,
      );
      expect(mockPrisma.attendance.create).not.toHaveBeenCalled();
    });
  });

  // ============ checkOut ============
  describe('checkOut', () => {
    it('should check out successfully', async () => {
      mockPrisma.member.findUnique.mockResolvedValue(mockMember);
      mockPrisma.attendance.findFirst.mockResolvedValue({
        id: 'att-1',
        check_out_at: null,
      });
      mockPrisma.attendance.update.mockResolvedValue({
        id: 'att-1',
        check_out_at: new Date(),
      });

      const result = await service.checkOut('user-1');

      expect(result.check_out_at).toBeDefined();
    });

    it('should throw NotFoundException if member not found', async () => {
      mockPrisma.member.findUnique.mockResolvedValue(null);

      await expect(service.checkOut('user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if no active session', async () => {
      mockPrisma.member.findUnique.mockResolvedValue(mockMember);
      mockPrisma.attendance.findFirst.mockResolvedValue(null);

      await expect(service.checkOut('user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ============ getStatus ============
  describe('getStatus', () => {
    it('should return active session if exists', async () => {
      mockPrisma.member.findUnique.mockResolvedValue(mockMember);
      mockPrisma.attendance.findFirst.mockResolvedValue({
        id: 'att-1',
        check_out_at: null,
      });

      const result = await service.getStatus('user-1');

      expect(result?.id).toBe('att-1');
    });

    it('should return null if no active session', async () => {
      mockPrisma.member.findUnique.mockResolvedValue(mockMember);
      mockPrisma.attendance.findFirst.mockResolvedValue(null);

      const result = await service.getStatus('user-1');

      expect(result).toBeNull();
    });
  });

  // ============ findMyHistory ============
  describe('findMyHistory', () => {
    it('should return attendance history ordered by check_in_at desc', async () => {
      mockPrisma.member.findUnique.mockResolvedValue(mockMember);
      mockPrisma.attendance.findMany.mockResolvedValue([{ id: 'att-1' }]);

      const result = await service.findMyHistory('user-1');

      expect(mockPrisma.attendance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { member_id: 'member-1' },
          orderBy: { check_in_at: 'desc' },
        }),
      );
      expect(result).toEqual([{ id: 'att-1' }]);
    });
  });

  // ============ findAll ============
  describe('findAll', () => {
    it('should return paginated data with default page/limit', async () => {
      mockPrisma.$transaction.mockResolvedValue([[], 0]);

      const result = await service.findAll({} as any);

      expect(result.meta).toEqual({
        total: 0,
        page: 1,
        limit: 20,
        total_pages: 0,
      });
    });

    it('should apply member_id filter', async () => {
      mockPrisma.$transaction.mockResolvedValue([[], 0]);

      await service.findAll({ member_id: 'member-1' } as any);

      expect(mockPrisma.attendance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { member_id: 'member-1' },
        }),
      );
    });

    it('should translate date_from/date_to into check_in_at range filter', async () => {
      mockPrisma.$transaction.mockResolvedValue([[], 0]);

      await service.findAll({
        date_from: '2026-08-01',
        date_to: '2026-08-31',
      } as any);

      expect(mockPrisma.attendance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            check_in_at: {
              gte: new Date('2026-08-01'),
              lte: new Date('2026-08-31'),
            },
          },
        }),
      );
    });
  });
});