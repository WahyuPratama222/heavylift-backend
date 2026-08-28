import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TrainersService } from './trainers.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TrainersService', () => {
  let service: TrainersService;

  const mockPrisma = {
    trainer: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockTrainer = { id: 'trainer-1', name: 'Budi', is_active: true };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrainersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TrainersService>(TrainersService);

    jest.resetAllMocks();
  });

  // ============ create ============
  describe('create', () => {
    it('should create a trainer successfully', async () => {
      mockPrisma.trainer.create.mockResolvedValue(mockTrainer);

      const result = await service.create({ name: 'Budi' } as any);

      expect(result).toEqual(mockTrainer);
    });
  });

  // ============ findAll ============
  describe('findAll', () => {
    it('should return only active trainers ordered by created_at desc', async () => {
      mockPrisma.$transaction.mockResolvedValue([[mockTrainer], 1]);

      const result = await service.findAll({} as any);

      expect(mockPrisma.trainer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { is_active: true },
          orderBy: { created_at: 'desc' },
        }),
      );
      expect(result.data).toEqual([mockTrainer]);
    });
  });

  // ============ findOne ============
  describe('findOne', () => {
    it('should return a trainer', async () => {
      mockPrisma.trainer.findUnique.mockResolvedValue(mockTrainer);

      const result = await service.findOne('trainer-1');

      expect(result).toEqual(mockTrainer);
    });

    it('should throw NotFoundException if trainer not found', async () => {
      mockPrisma.trainer.findUnique.mockResolvedValue(null);

      await expect(service.findOne('trainer-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ============ update ============
  describe('update', () => {
    it('should update a trainer successfully', async () => {
      mockPrisma.trainer.findUnique.mockResolvedValue(mockTrainer);
      mockPrisma.trainer.update.mockResolvedValue({
        ...mockTrainer,
        name: 'Budi Updated',
      });

      const result = await service.update('trainer-1', {
        name: 'Budi Updated',
      } as any);

      expect(result.name).toBe('Budi Updated');
    });

    it('should throw NotFoundException if trainer not found', async () => {
      mockPrisma.trainer.findUnique.mockResolvedValue(null);

      await expect(
        service.update('trainer-1', { name: 'X' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============ remove ============
  describe('remove', () => {
    it('should delete a trainer successfully', async () => {
      mockPrisma.trainer.findUnique.mockResolvedValue(mockTrainer);
      mockPrisma.trainer.delete.mockResolvedValue({});

      const result = await service.remove('trainer-1');

      expect(result).toEqual({ message: 'Trainer deleted successfully' });
    });

    it('should throw NotFoundException if trainer not found', async () => {
      mockPrisma.trainer.findUnique.mockResolvedValue(null);

      await expect(service.remove('trainer-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});