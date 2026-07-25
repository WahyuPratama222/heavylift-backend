import { PrismaClient } from '@prisma/client';
import { seedOwner } from './seeders/owner.seeder';
import { seedGymSettings } from './seeders/gym-settings.seeder';
import { seedGymSchedules } from './seeders/gym-schedules.seeder';

const prisma = new PrismaClient();

async function main() {
  await seedOwner(prisma);
  await seedGymSettings(prisma);
  await seedGymSchedules(prisma);

  console.log('Seeding selesai');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });