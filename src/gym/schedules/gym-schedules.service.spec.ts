import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GymSchedulesService } from './gym-schedules.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('GymSchedulesService', () => {
  let service: GymSchedulesService;

  const mockPrisma = {
    gymSchedule: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GymSchedulesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<GymSchedulesService>(GymSchedulesService);

    jest.resetAllMocks();
  });

  // ============ findAll ============
  describe('findAll', () => {
    it('should return schedules ordered by day asc', async () => {
      mockPrisma.gymSchedule.findMany.mockResolvedValue([
        { day: 'monday', open_time: '06:00', close_time: '22:00' },
      ]);

      await service.findAll();

      expect(mockPrisma.gymSchedule.findMany).toHaveBeenCalledWith({
        orderBy: { day: 'asc' },
      });
    });
  });

  // ============ update ============
  describe('update', () => {
    it('should update a schedule successfully', async () => {
      mockPrisma.gymSchedule.findUnique.mockResolvedValue({
        day: 'monday',
        open_time: '06:00',
      });
      mockPrisma.gymSchedule.update.mockResolvedValue({
        day: 'monday',
        open_time: '07:00',
      });

      const result = await service.update('monday' as any, {
        open_time: '07:00',
      } as any);

      expect(result.open_time).toBe('07:00');
    });

    it('should throw NotFoundException if schedule not found', async () => {
      mockPrisma.gymSchedule.findUnique.mockResolvedValue(null);

      await expect(
        service.update('monday' as any, { open_time: '07:00' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });
});