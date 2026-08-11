import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AnnouncementsService', () => {
  let service: AnnouncementsService;

  const mockPrisma = {
    announcement: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    member: {
      findUnique: jest.fn(),
    },
    memberPackage: {
      findFirst: jest.fn(),
    },
  };

  const mockAnnouncement = { id: 'ann-1', title: 'Gym Closed', target: 'all' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnnouncementsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AnnouncementsService>(AnnouncementsService);

    jest.resetAllMocks();
  });

  // ============ create ============
  describe('create', () => {
    it('should always force type to "manual" regardless of dto', async () => {
      const dto = { title: 'Promo', content: 'Diskon 20%', target: 'all' };
      mockPrisma.announcement.create.mockResolvedValue(mockAnnouncement);

      await service.create(dto as any);

      expect(mockPrisma.announcement.create).toHaveBeenCalledWith({
        data: { ...dto, type: 'manual' },
      });
    });
  });

  // ============ findAll ============
  describe('findAll', () => {
    it('should throw NotFoundException if member not found or soft-deleted', async () => {
      mockPrisma.member.findUnique.mockResolvedValue(null);

      await expect(service.findAll('user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should include specific_package condition when member has active package', async () => {
      mockPrisma.member.findUnique.mockResolvedValue({
        id: 'member-1',
        deleted_at: null,
      });
      mockPrisma.memberPackage.findFirst.mockResolvedValue({
        status: 'active',
        package_id: 'pkg-1',
      });
      mockPrisma.announcement.findMany.mockResolvedValue([]);

      await service.findAll('user-1');

      const callArg = mockPrisma.announcement.findMany.mock.calls[0][0];
      expect(callArg.where.AND.OR).toContainEqual({
        target: 'specific_package',
        package_id: 'pkg-1',
      });
    });

    it('should include no_package condition when member has no active package', async () => {
      mockPrisma.member.findUnique.mockResolvedValue({
        id: 'member-1',
        deleted_at: null,
      });
      mockPrisma.memberPackage.findFirst.mockResolvedValue({
        status: 'expired',
        package_id: 'pkg-1',
      });
      mockPrisma.announcement.findMany.mockResolvedValue([]);

      await service.findAll('user-1');

      const callArg = mockPrisma.announcement.findMany.mock.calls[0][0];
      expect(callArg.where.AND.OR).toContainEqual({ target: 'no_package' });
    });
  });

  // ============ findOne ============
  describe('findOne', () => {
    it('should return an announcement', async () => {
      mockPrisma.announcement.findUnique.mockResolvedValue(mockAnnouncement);

      const result = await service.findOne('ann-1');

      expect(result).toEqual(mockAnnouncement);
    });

    it('should throw NotFoundException if announcement not found', async () => {
      mockPrisma.announcement.findUnique.mockResolvedValue(null);

      await expect(service.findOne('ann-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ============ update ============
  describe('update', () => {
    it('should update an announcement successfully', async () => {
      mockPrisma.announcement.findUnique.mockResolvedValue(mockAnnouncement);
      mockPrisma.announcement.update.mockResolvedValue({
        ...mockAnnouncement,
        title: 'Updated',
      });

      const result = await service.update('ann-1', {
        title: 'Updated',
      } as any);

      expect(result.title).toBe('Updated');
    });

    it('should throw NotFoundException if announcement not found', async () => {
      mockPrisma.announcement.findUnique.mockResolvedValue(null);

      await expect(
        service.update('ann-1', { title: 'X' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============ remove ============
  describe('remove', () => {
    it('should delete an announcement successfully', async () => {
      mockPrisma.announcement.findUnique.mockResolvedValue(mockAnnouncement);
      mockPrisma.announcement.delete.mockResolvedValue({});

      const result = await service.remove('ann-1');

      expect(result).toEqual({ message: 'Announcement deleted successfully' });
    });

    it('should throw NotFoundException if announcement not found', async () => {
      mockPrisma.announcement.findUnique.mockResolvedValue(null);

      await expect(service.remove('ann-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});