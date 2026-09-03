import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { logDone, logStart } from '../log.util';

export async function seedTrainers(prisma: PrismaClient) {
  logStart('trainers');

  const trainers = [
    { name: 'Rizky Pratama', specialization: 'Strength Training' },
    { name: 'Dewi Anggraini', specialization: 'Yoga & Flexibility' },
    { name: 'Fajar Nugroho', specialization: 'HIIT & Cardio' },
    { name: 'Putri Wulandari', specialization: 'Weight Loss Coaching' },
  ];

  let totalCreated = 0;

  for (const trainer of trainers) {
    const existing = await prisma.trainer.findFirst({
      where: { name: trainer.name },
    });

    if (existing) continue;

    await prisma.trainer.create({
      data: {
        name: trainer.name,
        specialization: trainer.specialization,
        bio: faker.lorem.sentences(2),
        photo_url: faker.image.avatarGitHub(),
        is_active: true,
      },
    });

    totalCreated++;
  }

  logDone('trainers', `${totalCreated} trainers seeded`);
}