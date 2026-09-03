import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { logStart, logDone } from '../log.util';

export async function seedEquipments(prisma: PrismaClient) {
  logStart('equipments');

  const equipments = [
    { name: 'Treadmill Pro X1', category: 'Cardio' },
    { name: 'Rowing Machine Elite', category: 'Cardio' },
    { name: 'Barbell Set Olympic', category: 'Strength' },
    { name: 'Squat Rack Heavy Duty', category: 'Strength' },
    { name: 'Dumbbell Set 1-20kg', category: 'Strength' },
    { name: 'Cable Crossover Machine', category: 'Strength' },
    { name: 'Yoga Mat Premium', category: 'Flexibility' },
  ];

  let totalCreated = 0;

  for (const equipment of equipments) {
    // Cek dulu apakah equipment sudah ada
    const existing = await prisma.equipment.findUnique({
      where: { name: equipment.name },
    });

    let equipmentId: string;

    if (existing) {
      // Kalau sudah ada, pakai ID yang lama dan skip proses create
      equipmentId = existing.id;
    } else {
      // Kalau belum ada, baru create data equipment baru
      const created = await prisma.equipment.create({
        data: {
          name: equipment.name,
          category: equipment.category,
          description: faker.lorem.sentence(),
          condition: faker.helpers.arrayElement(['good', 'good', 'good', 'maintenance']),
          is_active: true,
        },
      });
      equipmentId = created.id;
      
      totalCreated++;
    }

    // Cek foto equipment
    const existingPhotos = await prisma.equipmentPhoto.count({
      where: { equipment_id: equipmentId },
    });

    if (existingPhotos === 0) {
      await prisma.equipmentPhoto.create({
        data: {
          equipment_id: equipmentId,
          url: faker.image.urlPicsumPhotos(),
          order: 0,
        },
      });
    }
  }

  logDone('equipments', `${totalCreated} equipments seeded`);
}