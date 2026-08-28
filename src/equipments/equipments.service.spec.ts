import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { EquipmentsService } from './equipments.service';
import { PrismaService } from '../prisma/prisma.service';

describe('EquipmentsService', () => {
  let service: EquipmentsService;

  const mockPrisma = {
    equipment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    equipmentPhoto: {
      aggregate: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const p2002Error = new Prisma.PrismaClientKnownRequestError(
    'Unique constraint failed on the fields: (`name`)',
    { code: 'P2002', clientVersion: '5.0.0' },
  );

  const mockEquipment = { id: 'eq-1', name: 'Treadmill' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EquipmentsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<EquipmentsService>(EquipmentsService);

    jest.resetAllMocks();
  });

  // ============ create ============
  describe('create', () => {
    const dto = { name: 'Treadmill', category: 'Cardio' };

    it('should create equipment successfully', async () => {
      mockPrisma.equipment.create.mockResolvedValue(mockEquipment);

      const result = await service.create(dto as any);

      expect(result).toEqual(mockEquipment);
    });

    it('should throw ConflictException if name already exists', async () => {
      mockPrisma.equipment.create.mockRejectedValue(p2002Error);

      await expect(service.create(dto as any)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ============ findAll ============
  describe('findAll', () => {
    it('should return paginated equipments by default', async () => {
      mockPrisma.$transaction.mockResolvedValue([[mockEquipment], 1]);

      const result = await service.findAll({} as any);

      expect(result.data).toEqual([mockEquipment]);
      expect(result.meta.total).toBe(1);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should apply search filter', async () => {
      mockPrisma.$transaction.mockResolvedValue([[], 0]);

      const result = await service.findAll({ search: 'tread' } as any);

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should apply category filter', async () => {
      mockPrisma.$transaction.mockResolvedValue([[], 0]);

      const result = await service.findAll({ category: 'Cardio' } as any);

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });
  
  // ============ findOne ============
  describe('findOne', () => {
    it('should return an equipment', async () => {
      mockPrisma.equipment.findUnique.mockResolvedValue(mockEquipment);

      const result = await service.findOne('eq-1');

      expect(result).toEqual(mockEquipment);
    });

    it('should throw NotFoundException if equipment not found', async () => {
      mockPrisma.equipment.findUnique.mockResolvedValue(null);

      await expect(service.findOne('eq-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ============ update ============
  describe('update', () => {
    it('should update successfully', async () => {
      mockPrisma.equipment.findUnique.mockResolvedValue(mockEquipment);
      mockPrisma.equipment.update.mockResolvedValue({
        ...mockEquipment,
        name: 'Treadmill Pro',
      });

      const result = await service.update('eq-1', {
        name: 'Treadmill Pro',
      } as any);

      expect(result.name).toBe('Treadmill Pro');
    });

    it('should throw NotFoundException if equipment not found', async () => {
      mockPrisma.equipment.findUnique.mockResolvedValue(null);

      await expect(
        service.update('eq-1', { name: 'X' } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if updated name already exists', async () => {
      mockPrisma.equipment.findUnique.mockResolvedValue(mockEquipment);
      mockPrisma.equipment.update.mockRejectedValue(p2002Error);

      await expect(
        service.update('eq-1', { name: 'Duplicate' } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ============ remove ============
  describe('remove', () => {
    it('should delete equipment successfully', async () => {
      mockPrisma.equipment.findUnique.mockResolvedValue(mockEquipment);
      mockPrisma.equipment.delete.mockResolvedValue({});

      const result = await service.remove('eq-1');

      expect(result).toEqual({ message: 'Equipment deleted successfully' });
    });

    it('should throw NotFoundException if equipment not found', async () => {
      mockPrisma.equipment.findUnique.mockResolvedValue(null);

      await expect(service.remove('eq-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ============ addPhotos ============
  describe('addPhotos', () => {
    const dto = { photo_urls: ['a.jpg', 'b.jpg'] };

    it('should start order from 0 when no existing photos', async () => {
      mockPrisma.equipment.findUnique.mockResolvedValue(mockEquipment);
      mockPrisma.equipmentPhoto.aggregate.mockResolvedValue({
        _max: { order: null },
      });
      mockPrisma.$transaction.mockResolvedValue([
        { id: 'p1', order: 0 },
        { id: 'p2', order: 1 },
      ]);

      await service.addPhotos('eq-1', dto as any);

      expect(mockPrisma.equipmentPhoto.create).toHaveBeenCalledWith({
        data: { equipment_id: 'eq-1', url: 'a.jpg', order: 0 },
      });
      expect(mockPrisma.equipmentPhoto.create).toHaveBeenCalledWith({
        data: { equipment_id: 'eq-1', url: 'b.jpg', order: 1 },
      });
    });

    it('should continue order from maxOrder + 1 when photos exist', async () => {
      mockPrisma.equipment.findUnique.mockResolvedValue(mockEquipment);
      mockPrisma.equipmentPhoto.aggregate.mockResolvedValue({
        _max: { order: 4 },
      });
      mockPrisma.$transaction.mockResolvedValue([{ id: 'p3', order: 5 }]);

      await service.addPhotos('eq-1', { photo_urls: ['c.jpg'] } as any);

      expect(mockPrisma.equipmentPhoto.create).toHaveBeenCalledWith({
        data: { equipment_id: 'eq-1', url: 'c.jpg', order: 5 },
      });
    });

    it('should throw NotFoundException if equipment not found', async () => {
      mockPrisma.equipment.findUnique.mockResolvedValue(null);

      await expect(service.addPhotos('eq-1', dto as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ============ removePhoto ============
  describe('removePhoto', () => {
    it('should delete photo successfully', async () => {
      mockPrisma.equipmentPhoto.findUnique.mockResolvedValue({
        id: 'photo-1',
        equipment_id: 'eq-1',
      });
      mockPrisma.equipmentPhoto.delete.mockResolvedValue({});

      const result = await service.removePhoto('eq-1', 'photo-1');

      expect(result).toEqual({ message: 'Photo deleted successfully' });
    });

    it('should throw NotFoundException if photo not found', async () => {
      mockPrisma.equipmentPhoto.findUnique.mockResolvedValue(null);

      await expect(
        service.removePhoto('eq-1', 'photo-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if photo belongs to a different equipment', async () => {
      mockPrisma.equipmentPhoto.findUnique.mockResolvedValue({
        id: 'photo-1',
        equipment_id: 'eq-OTHER',
      });

      await expect(
        service.removePhoto('eq-1', 'photo-1'),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrisma.equipmentPhoto.delete).not.toHaveBeenCalled();
    });
  });
});