import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { logDone, logStart } from '../log.util';

export async function seedPackages(prisma: PrismaClient) {
  logStart('packages');

  const packages = [
    {
      name: 'Bulanan Hemat',
      category: 'Bulanan',
      price: 250000,
      duration_days: 30,
      include_trainer: false,
    },
    {
      name: 'Bulanan Plus',
      category: 'Bulanan',
      price: 400000,
      duration_days: 30,
      include_trainer: true,
    },
    {
      name: 'Tahunan Reguler',
      category: 'Tahunan',
      price: 2500000,
      duration_days: 365,
      include_trainer: false,
    },
    {
      name: 'Tahunan Premium',
      category: 'Tahunan',
      price: 4000000,
      duration_days: 365,
      include_trainer: true,
    },
    {
      name: 'Personal Training 10x',
      category: 'Personal Training',
      price: 1500000,
      duration_days: 60,
      include_trainer: true,
    },
  ];

  let totalCreated = 0;

  for (const pkg of packages) {
    const category = await prisma.packageCategory.findUnique({
      where: { name: pkg.category },
    });

    if (!category) {
      throw new Error(
        `Package category "${pkg.category}" not found — make sure seedPackageCategories runs first`,
      );
    }

    const existing = await prisma.package.findUnique({
      where: { name: pkg.name },
    });

    if (existing) continue;

    await prisma.package.create({
      data: {
        name: pkg.name,
        category_id: category.id,
        description: faker.lorem.sentence(),
        price: pkg.price,
        duration_days: pkg.duration_days,
        include_trainer: pkg.include_trainer,
        benefits: [
          'Akses semua alat gym',
          faker.helpers.arrayElement(['Kelas group fitness gratis', 'Konsultasi nutrisi', 'Locker pribadi']),
          ...(pkg.include_trainer ? ['Pendampingan personal trainer'] : []),
        ],
        is_active: true,
      },
    });

    totalCreated++; 
  }

  logDone('packages', `${totalCreated} packages seeded`);
}