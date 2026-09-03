import { PrismaClient } from '@prisma/client';
import { seedPackageCategories } from './seeders/dummy/package-categories.seeder';
import { seedPackages } from './seeders/dummy/packages.seeder';
import { seedTrainers } from './seeders/dummy/trainers.seeder';
import { seedEquipments } from './seeders/dummy/equipments.seeder';
import { seedMembers } from './seeders/dummy/members.seeder';
import { seedMemberPackages } from './seeders/dummy/member-packages.seeder';
import { seedAttendances } from './seeders/dummy/attendances.seeder';
import { seedReviews } from './seeders/dummy/reviews.seeder';
import { seedAnnouncements } from './seeders/dummy/announcements.seeder';
import { logSection, logSummary } from './seeders/log.util';

const prisma = new PrismaClient();

async function main() {
  const startedAt = Date.now();

  logSection('🌱 Seeding Dummy Data (development only)');

  await seedPackageCategories(prisma);
  await seedPackages(prisma);
  await seedTrainers(prisma);
  await seedEquipments(prisma);

  await seedMembers(prisma);
  await seedMemberPackages(prisma);

  await seedAttendances(prisma);
  await seedReviews(prisma);

  await seedAnnouncements(prisma);

  logSummary('✅ Dummy data seeded successfully', Date.now() - startedAt);
}

main()
  .catch((e) => {
    console.error('\n❌ Seeding failed:', e.message ?? e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });