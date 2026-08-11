import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PackageCategoriesService } from './package-categories.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PackageCategoriesService', () => {
  let service: PackageCategoriesService;

  const mockPrisma = {
    packageCategory: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    package: {
      count: jest.fn(),
    },
  };

  // error asli dari Prisma, dipakai buat nyimulasiin duplicate name (unique constraint)
  const p2002Error = new Prisma.PrismaClientKnownRequestError(
    'Unique constraint failed on the fields: (`name`)',
    { code: 'P2002', clientVersion: '5.0.0' },
  );

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PackageCategoriesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PackageCategoriesService>(PackageCategoriesService);

    jest.resetAllMocks();
  });

  // ============ create ============
  describe('create', () => {
    const dto = { name: 'Bulanan', description: 'Paket per bulan' };

    it('should create a category successfully', async () => {
      mockPrisma.packageCategory.create.mockResolvedValue({
        id: 'cat-1',
        ...dto,
      });

      const result = await service.create(dto as any);

      expect(result).toEqual({ id: 'cat-1', ...dto });
    });

    it('should throw ConflictException if name already exists', async () => {
      mockPrisma.packageCategory.create.mockRejectedValue(p2002Error);

      await expect(service.create(dto as any)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ============ findAll ============
  describe('findAll', () => {
    it('should return all categories ordered by created_at desc', async () => {
      mockPrisma.packageCategory.findMany.mockResolvedValue([
        { id: 'cat-1', name: 'Bulanan' },
      ]);

      const result = await service.findAll();

      expect(mockPrisma.packageCategory.findMany).toHaveBeenCalledWith({
        orderBy: { created_at: 'desc' },
      });
      expect(result).toHaveLength(1);
    });
  });

  // ============ findOne ============
  describe('findOne', () => {
    it('should return a category', async () => {
      mockPrisma.packageCategory.findUnique.mockResolvedValue({
        id: 'cat-1',
        name: 'Bulanan',
      });

      const result = await service.findOne('cat-1');

      expect(result.name).toBe('Bulanan');
    });

    it('should throw NotFoundException if category not found', async () => {
      mockPrisma.packageCategory.findUnique.mockResolvedValue(null);

      await expect(service.findOne('cat-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ============ update ============
  describe('update', () => {
    const dto = { name: 'Bulanan Updated' };

    it('should update a category successfully', async () => {
      mockPrisma.packageCategory.findUnique.mockResolvedValue({
        id: 'cat-1',
        name: 'Bulanan',
      });
      mockPrisma.packageCategory.update.mockResolvedValue({
        id: 'cat-1',
        ...dto,
      });

      const result = await service.update('cat-1', dto as any);

      expect(result.name).toBe('Bulanan Updated');
    });

    it('should throw NotFoundException if category not found', async () => {
      mockPrisma.packageCategory.findUnique.mockResolvedValue(null);

      await expect(service.update('cat-1', dto as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if updated name already exists', async () => {
      mockPrisma.packageCategory.findUnique.mockResolvedValue({
        id: 'cat-1',
        name: 'Bulanan',
      });
      mockPrisma.packageCategory.update.mockRejectedValue(p2002Error);

      await expect(service.update('cat-1', dto as any)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ============ remove ============
  describe('remove', () => {
    it('should delete category when no package uses it', async () => {
      mockPrisma.packageCategory.findUnique.mockResolvedValue({
        id: 'cat-1',
      });
      mockPrisma.package.count.mockResolvedValue(0);
      mockPrisma.packageCategory.delete.mockResolvedValue({});

      const result = await service.remove('cat-1');

      expect(result).toEqual({
        message: 'Package category deleted successfully',
      });
    });

    it('should throw NotFoundException if category not found', async () => {
      mockPrisma.packageCategory.findUnique.mockResolvedValue(null);

      await expect(service.remove('cat-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if packages still reference this category', async () => {
      mockPrisma.packageCategory.findUnique.mockResolvedValue({
        id: 'cat-1',
      });
      mockPrisma.package.count.mockResolvedValue(3);

      await expect(service.remove('cat-1')).rejects.toThrow(
        ConflictException,
      );
      expect(mockPrisma.packageCategory.delete).not.toHaveBeenCalled();
    });
  });
});