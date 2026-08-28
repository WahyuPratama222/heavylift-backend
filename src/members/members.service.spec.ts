import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { MembersService } from './members.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MembersService', () => {
  let service: MembersService;

  const mockPrisma = {
    member: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<MembersService>(MembersService);

    jest.resetAllMocks();
  });

  // ============ getProfile ============
  describe('getProfile', () => {
    it('should return profile without deleted_at field', async () => {
      mockPrisma.member.findUnique.mockResolvedValue({
        id: 'member-1',
        name: 'Wahyu',
        deleted_at: null,
      });

      const result = await service.getProfile('user-1');

      expect(result).not.toHaveProperty('deleted_at');
      expect(result.name).toBe('Wahyu');
    });

    it('should throw NotFoundException if member not found', async () => {
      mockPrisma.member.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if member is soft-deleted', async () => {
      mockPrisma.member.findUnique.mockResolvedValue({
        id: 'member-1',
        deleted_at: new Date(),
      });

      await expect(service.getProfile('user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ============ updateProfile ============
  describe('updateProfile', () => {
    const dto = { name: 'Wahyu Updated', date_of_birth: '2000-01-01' };

    it('should update profile and convert date_of_birth to Date', async () => {
      mockPrisma.member.findUnique
        .mockResolvedValueOnce({ id: 'member-1', deleted_at: null })
        .mockResolvedValueOnce(undefined);

      mockPrisma.member.update.mockResolvedValue({
        id: 'member-1',
        name: dto.name,
      });

      await service.updateProfile('user-1', dto as any);

      expect(mockPrisma.member.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            date_of_birth: new Date('2000-01-01'),
          }),
        }),
      );
    });

    it('should leave date_of_birth undefined if not provided', async () => {
      mockPrisma.member.findUnique.mockResolvedValue({
        id: 'member-1',
        deleted_at: null,
      });
      mockPrisma.member.update.mockResolvedValue({ id: 'member-1' });

      await service.updateProfile('user-1', { name: 'Wahyu' } as any);

      expect(mockPrisma.member.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ date_of_birth: undefined }),
        }),
      );
    });

    it('should throw NotFoundException if member not found or soft-deleted', async () => {
      mockPrisma.member.findUnique.mockResolvedValue(null);

      await expect(
        service.updateProfile('user-1', dto as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============ updatePhoto ============
  describe('updatePhoto', () => {
    it('should update photo_url', async () => {
      mockPrisma.member.findUnique.mockResolvedValue({
        id: 'member-1',
        deleted_at: null,
      });
      mockPrisma.member.update.mockResolvedValue({
        id: 'member-1',
        photo_url: 'new-photo.jpg',
      });

      const result = await service.updatePhoto('user-1', {
        photo_url: 'new-photo.jpg',
      });

      expect(result.photo_url).toBe('new-photo.jpg');
    });

    it('should throw NotFoundException if member not found or soft-deleted', async () => {
      mockPrisma.member.findUnique.mockResolvedValue(null);

      await expect(
        service.updatePhoto('user-1', { photo_url: 'x.jpg' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============ findAll ============
  describe('findAll', () => {
    it('should return paginated data with meta', async () => {
      mockPrisma.$transaction.mockResolvedValue([
        [{ id: '1', name: 'A', member_packages: [] }],
        1,
      ]);

      const result = await service.findAll({ page: 1, limit: 10 } as any);

      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        total_pages: 1,
      });
    });

    it('should derive status "no_package" when member_packages is empty', async () => {
      mockPrisma.$transaction.mockResolvedValue([
        [{ id: '1', name: 'A', member_packages: [] }],
        1,
      ]);

      const result = await service.findAll({} as any);

      expect(result.data[0].status).toBe('no_package');
    });

    it('should derive status "active" when latest package status is active', async () => {
      mockPrisma.$transaction.mockResolvedValue([
        [{ id: '1', name: 'A', member_packages: [{ status: 'active' }] }],
        1,
      ]);

      const result = await service.findAll({} as any);

      expect(result.data[0].status).toBe('active');
    });

    it('should derive status "expired" when latest package status is expired or cancelled', async () => {
      mockPrisma.$transaction.mockResolvedValue([
        [{ id: '1', name: 'A', member_packages: [{ status: 'cancelled' }] }],
        1,
      ]);

      const result = await service.findAll({} as any);

      expect(result.data[0].status).toBe('expired');
    });

    it('should pass search filter into where clause', async () => {
      mockPrisma.$transaction.mockResolvedValue([[], 0]);

      await service.findAll({ search: 'wahyu' } as any);

      expect(mockPrisma.member.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { contains: 'wahyu', mode: 'insensitive' },
          }),
        }),
      );
    });

    it('should translate status=no_package filter into correct where clause', async () => {
      mockPrisma.$transaction.mockResolvedValue([[], 0]);

      await service.findAll({ status: 'no_package' } as any);

      expect(mockPrisma.member.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            member_packages: { none: {} },
          }),
        }),
      );
    });
  });

  // ============ findOne ============
  describe('findOne', () => {
    it('should convert price and amount from Decimal to Number', async () => {
      mockPrisma.member.findFirst.mockResolvedValue({
        id: 'member-1',
        member_packages: [
          {
            id: 'mp-1',
            package: { name: 'Bulanan', price: { toString: () => '150000' } },
            payments: [{ id: 'p-1', amount: { toString: () => '150000' } }],
          },
        ],
      });

      const result = await service.findOne('member-1');

      expect(typeof result.member_packages[0].package.price).toBe('number');
      expect(typeof result.member_packages[0].payments[0].amount).toBe(
        'number',
      );
    });

    it('should throw NotFoundException if member not found', async () => {
      mockPrisma.member.findFirst.mockResolvedValue(null);

      await expect(service.findOne('member-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ============ remove ============
  describe('remove', () => {
    it('should soft-delete member and return success message', async () => {
      mockPrisma.member.findFirst.mockResolvedValue({ id: 'member-1' });
      mockPrisma.member.update.mockResolvedValue({});

      const result = await service.remove('member-1');

      expect(mockPrisma.member.update).toHaveBeenCalledWith({
        where: { id: 'member-1' },
        data: { deleted_at: expect.any(Date) },
      });
      expect(result).toEqual({ message: 'Member deleted successfully' });
    });

    it('should throw NotFoundException if member not found', async () => {
      mockPrisma.member.findFirst.mockResolvedValue(null);

      await expect(service.remove('member-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});