import { NestFactory } from '@nestjs/core';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '../src/app.module';
import { seedGymSchedules } from './seeders/essentials/gym-schedules.seeder';
import { seedGymSettings } from './seeders/essentials/gym-settings.seeder';
import { seedOwner } from './seeders/essentials/owner.seeder';
import { logSection, logSummary } from './seeders/log.util';

const prisma = new PrismaClient();

async function main() {
  const startedAt = Date.now();
  const appContext = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });
  const config = appContext.get(ConfigService);

  logSection('🌱 Seeding Essentials (production-safe)');

  await seedGymSchedules(prisma);
  await seedGymSettings(prisma);
  await seedOwner(prisma, config);

  await appContext.close();
  await prisma.$disconnect();

  logSummary('✅ Essentials seeded successfully', Date.now() - startedAt);
  process.exit(0);
}

main().catch((e) => {
  console.error('\n❌ Seeding failed:', e.message ?? e);
  process.exit(1);
});