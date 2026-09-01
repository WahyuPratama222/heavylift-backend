import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GymSettingsService } from './gym-settings.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('GymSettingsService', () => {
  let service: GymSettingsService;

  const mockPrisma = {
    gymSetting: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const SETTINGS_ID = 'gym-settings-singleton';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GymSettingsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<GymSettingsService>(GymSettingsService);

    jest.resetAllMocks();
  });

  // ============ update ============
  describe('update', () => {
    it('should upsert with provided gym_name', async () => {
        const dto = { gym_name: 'My Gym', phone: '0812345' };
        mockPrisma.gymSetting.upsert.mockResolvedValue({ id: SETTINGS_ID, ...dto });

        await service.update(dto as any);

        expect(mockPrisma.gymSetting.upsert).toHaveBeenCalledWith({
            where: { id: SETTINGS_ID },
            update: dto,
            create: {
            id: SETTINGS_ID,
            ...dto,
            },
        });
    });

    it('should fallback gym_name to "HeavyLift Gym" if not provided', async () => {
      const dto = { phone: '0812345' };
      mockPrisma.gymSetting.upsert.mockResolvedValue({ id: SETTINGS_ID, ...dto });

      await service.update(dto as any);

      expect(mockPrisma.gymSetting.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ gym_name: 'HeavyLift Gym' }),
        }),
      );
    });

    it('should not let undefined gym_name override the fallback (regression)', async () => {
      const dto = { gym_name: undefined, phone: '0812345' };
      mockPrisma.gymSetting.upsert.mockResolvedValue({ id: SETTINGS_ID, ...dto, gym_name: 'HeavyLift Gym' });

      await service.update(dto as any);

      expect(mockPrisma.gymSetting.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ gym_name: 'HeavyLift Gym' }),
        }),
      );
    });
  });

  // ============ findOne ============
  describe('findOne', () => {
    it('should return settings', async () => {
      mockPrisma.gymSetting.findUnique.mockResolvedValue({
        id: SETTINGS_ID,
        gym_name: 'HeavyLift Gym',
      });

      const result = await service.findOne();

      expect(result.gym_name).toBe('HeavyLift Gym');
    });

    it('should throw NotFoundException if settings not found', async () => {
      mockPrisma.gymSetting.findUnique.mockResolvedValue(null);

      await expect(service.findOne()).rejects.toThrow(NotFoundException);
    });
  });
});