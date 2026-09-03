import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { logDone, logStart } from '../log.util';

export async function seedAttendances(prisma: PrismaClient) {
  logStart('attendances')

  const activeMembers = await prisma.member.findMany({
    where: {
      member_packages: { some: { status: 'active' } },
    },
    select: { id: true },
  });

  if (activeMembers.length === 0) {
    console.log('✓ No active members found, skipping attendances');
    return;
  }

  let totalCreated = 0;

  for (const member of activeMembers) {
    const existing = await prisma.attendance.count({
      where: { member_id: member.id },
    });
    if (existing > 0) continue;

    const sessionCount = faker.number.int({ min: 3, max: 10 });

    for (let i = 0; i < sessionCount; i++) {
      const checkIn = faker.date.recent({ days: 30 });
      const durationMinutes = faker.number.int({ min: 30, max: 120 });
      const checkOut = new Date(checkIn.getTime() + durationMinutes * 60 * 1000);

      await prisma.attendance.create({
        data: {
          member_id: member.id,
          check_in_at: checkIn,
          check_out_at: checkOut,
        },
      });
      
      totalCreated++;
    }
  }

  logDone('attendances', `${totalCreated} attendance records seeded across ${activeMembers.length} active members`);
}