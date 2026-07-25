import { PrismaClient } from '@prisma/client';

export async function seedGymSettings(prisma: PrismaClient) {
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

  console.log('✓ Gym settings seeded');
}