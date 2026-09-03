import { PrismaClient } from '@prisma/client';
import { logStart, logDone } from '../log.util';

export async function seedGymSettings(prisma: PrismaClient) {
  logStart('gym-settings');

  await prisma.gymSetting.upsert({
    where: { id: 'gym-settings-singleton' },
    update: {},
    create: {
      id: 'gym-settings-singleton',
      gym_name: 'HeavyLift Gym',
      address: 'Jl. Fitness No. 1, Jakarta Selatan',
      phone: '02112345678',
      email: 'info@heavylift.com',
    },
  });

  logDone('gym-settings', 'Gym settings seeded (singleton)');
}