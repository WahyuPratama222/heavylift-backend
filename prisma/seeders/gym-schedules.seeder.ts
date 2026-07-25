import { PrismaClient } from '@prisma/client';

export async function seedGymSchedules(prisma: PrismaClient) {
  const defaultSchedules = [
    { day: 'monday', open_time: '06:00', close_time: '22:00' },
    { day: 'tuesday', open_time: '06:00', close_time: '22:00' },
    { day: 'wednesday', open_time: '06:00', close_time: '22:00' },
    { day: 'thursday', open_time: '06:00', close_time: '22:00' },
    { day: 'friday', open_time: '06:00', close_time: '22:00' },
    { day: 'saturday', open_time: '08:00', close_time: '20:00' },
    { day: 'sunday', open_time: '08:00', close_time: '20:00' },
  ] as const;

  for (const schedule of defaultSchedules) {
    await prisma.gymSchedule.upsert({
      where: { day: schedule.day },
      update: {},
      create: schedule,
    });
  }

  console.log('✓ Gym schedules seeded');
}