import { PrismaClient } from '@prisma/client';
import { logStart, logDone } from '../log.util';

export async function seedGymSchedules(prisma: PrismaClient) {
  logStart('gym-schedules');

  const defaultSchedules = [
    { day: 'monday', open_time: '06:00', close_time: '22:00' },
    { day: 'tuesday', open_time: '06:00', close_time: '22:00' },
    { day: 'wednesday', open_time: '06:00', close_time: '22:00' },
    { day: 'thursday', open_time: '06:00', close_time: '22:00' },
    { day: 'friday', open_time: '06:00', close_time: '22:00' },
    { day: 'saturday', open_time: '08:00', close_time: '20:00' },
    { day: 'sunday', open_time: '08:00', close_time: '20:00' },
  ] as const;

  let totalCreated = 0; // Track newly created schedules for accurate logging

  for (const schedule of defaultSchedules) {
    // Check if the schedule for this day already exists
    const existing = await prisma.gymSchedule.findUnique({
      where: { day: schedule.day },
    });

    if (existing) continue; // Skip if it already exists to maintain idempotency

    // Create new schedule if it doesn't exist yet
    await prisma.gymSchedule.create({
      data: schedule,
    });

    totalCreated++;
  }

  logDone('gym-schedules', `${totalCreated} gym schedules seeded`);
}