import { PrismaClient } from '@prisma/client';
import { logDone, logStart } from '../log.util';

export async function seedPackageCategories(prisma: PrismaClient) {
  logStart('package-categories');

  const categories = [
    { name: 'Bulanan', description: 'Paket keanggotaan bulanan, fleksibel tanpa komitmen jangka panjang' },
    { name: 'Tahunan', description: 'Paket keanggotaan tahunan dengan harga lebih hemat per bulan' },
    { name: 'Personal Training', description: 'Paket dengan sesi latihan didampingi trainer pribadi' },
  ];

  let totalCreated = 0;

  for (const category of categories) {
    const existing = await prisma.packageCategory.findUnique({
      where: { name: category.name },
    });

    if (existing) continue;

    await prisma.packageCategory.create({
      data: category,
    });

    totalCreated++;
  }

  logDone('package-categories', `${totalCreated} package categories seeded`);
}