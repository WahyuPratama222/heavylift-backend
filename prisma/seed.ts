import { PrismaClient } from '@prisma/client';
import { seedGymSchedules } from './seeders/essentials/gym-schedules.seeder';
import { seedGymSettings } from './seeders/essentials/gym-settings.seeder';
import { seedOwner } from './seeders/essentials/owner.seeder';
import { logSection, logSummary } from './seeders/log.util';

const prisma = new PrismaClient();

const config = { get: (key: string) => process.env[key] };

async function main() {
  const startedAt = Date.now();

  logSection('🌱 Seeding Essentials (production-safe)');

  await seedGymSchedules(prisma);
  await seedGymSettings(prisma);
  await seedOwner(prisma, config as any);

  await prisma.$disconnect();

  logSummary('✅ Essentials seeded successfully', Date.now() - startedAt);
  process.exit(0);
}

main().catch((e) => {
  console.error('\n❌ Seeding failed:', e.message ?? e);
  process.exit(1);
});