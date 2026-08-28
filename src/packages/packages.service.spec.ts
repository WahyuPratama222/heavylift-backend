import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PackagesService } from './packages.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PackagesService', () => {
  let service: PackagesService;

  const mockPrisma = {
    package: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    packageCategory: {
      findUnique: jest.fn(),
    },
    memberPackage: {
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const p2002Error = new Prisma.PrismaClientKnownRequestError(
    'Unique constraint failed on the fields: (`name`)',
    { code: 'P2002', clientVersion: '5.0.0' },
  );

  const mockPackage = {
    id: 'pkg-1',
    category_id: 'cat-1',
    name: 'Bulanan',
    price: { toString: () => '150000' },
    category: { id: 'cat-1', name: 'Bulanan Category' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PackagesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PackagesService>(PackagesService);

    jest.resetAllMocks();
  });

  // ============ create ============
  describe('create', () => {
    const dto = { category_id: 'cat-1', name: 'Bulanan', price: 150000 };

    it('should create a package and convert price to Number', async () => {
      mockPrisma.packageCategory.findUnique.mockResolvedValue({
        id: 'cat-1',
      });
      mockPrisma.package.create.mockResolvedValue(mockPackage);

      const result = await service.create(dto as any);

      expect(typeof result.price).toBe('number');
      expect(result.price).toBe(150000);
    });

    it('should throw NotFoundException if category_id not found', async () => {
      mockPrisma.packageCategory.findUnique.mockResolvedValue(null);

      await expect(service.create(dto as any)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrisma.package.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if package name already exists', async () => {
      mockPrisma.packageCategory.findUnique.mockResolvedValue({
        id: 'cat-1',
      });
      mockPrisma.package.create.mockRejectedValue(p2002Error);

      await expect(service.create(dto as any)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ============ findAll ============
  describe('findAll', () => {
    it('should return all packages with price converted to Number', async () => {
      mockPrisma.$transaction.mockResolvedValue([[mockPackage], 1]);

      const result = await service.findAll({} as any);

      expect(typeof result.data[0].price).toBe('number');
    });

    it('should pass categoryId filter into where clause', async () => {
      mockPrisma.$transaction.mockResolvedValue([[], 0]);

      await service.findAll({ category_id: 'cat-1' } as any);

      expect(mockPrisma.package.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category_id: 'cat-1' }),
        }),
      );
    });
  });

  // ============ findOne ============
  describe('findOne', () => {
    it('should return a package', async () => {
      mockPrisma.package.findUnique.mockResolvedValue(mockPackage);

      const result = await service.findOne('pkg-1');

      expect(result.id).toBe('pkg-1');
    });

    it('should throw NotFoundException if package not found', async () => {
      mockPrisma.package.findUnique.mockResolvedValue(null);

      await expect(service.findOne('pkg-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ============ update ============
  describe('update', () => {
    it('should update successfully without changing category_id', async () => {
      mockPrisma.package.findUnique.mockResolvedValue(mockPackage);
      mockPrisma.package.update.mockResolvedValue({
        ...mockPackage,
        name: 'Bulanan Updated',
      });

      const result = await service.update('pkg-1', {
        name: 'Bulanan Updated',
      } as any);

      expect(result.name).toBe('Bulanan Updated');
      expect(mockPrisma.packageCategory.findUnique).not.toHaveBeenCalled();
    });

    it('should update successfully when changing category_id (validated)', async () => {
      mockPrisma.package.findUnique.mockResolvedValue(mockPackage);
      mockPrisma.packageCategory.findUnique.mockResolvedValue({
        id: 'cat-2',
      });
      mockPrisma.package.update.mockResolvedValue({
        ...mockPackage,
        category_id: 'cat-2',
      });

      const result = await service.update('pkg-1', {
        category_id: 'cat-2',
      } as any);

      expect(result.category_id).toBe('cat-2');
    });

    it('should throw NotFoundException if package itself not found', async () => {
      mockPrisma.package.findUnique.mockResolvedValue(null);

      await expect(
        service.update('pkg-1', { name: 'X' } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if new category_id not found', async () => {
      mockPrisma.package.findUnique.mockResolvedValue(mockPackage);
      mockPrisma.packageCategory.findUnique.mockResolvedValue(null);

      await expect(
        service.update('pkg-1', { category_id: 'cat-invalid' } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if updated name already exists', async () => {
      mockPrisma.package.findUnique.mockResolvedValue(mockPackage);
      mockPrisma.package.update.mockRejectedValue(p2002Error);

      await expect(
        service.update('pkg-1', { name: 'Duplicate' } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ============ remove ============
  describe('remove', () => {
    it('should delete package when no member uses it', async () => {
      mockPrisma.package.findUnique.mockResolvedValue(mockPackage);
      mockPrisma.memberPackage.count.mockResolvedValue(0);
      mockPrisma.package.delete.mockResolvedValue({});

      const result = await service.remove('pkg-1');

      expect(result).toEqual({ message: 'Package deleted successfully' });
    });

    it('should throw NotFoundException if package not found', async () => {
      mockPrisma.package.findUnique.mockResolvedValue(null);

      await expect(service.remove('pkg-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if members still use this package', async () => {
      mockPrisma.package.findUnique.mockResolvedValue(mockPackage);
      mockPrisma.memberPackage.count.mockResolvedValue(2);

      await expect(service.remove('pkg-1')).rejects.toThrow(
        ConflictException,
      );
      expect(mockPrisma.package.delete).not.toHaveBeenCalled();
    });
  });
});