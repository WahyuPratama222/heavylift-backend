import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { logDone, logStart } from '../log.util';

const REVIEW_WINDOW_DAYS = 14;

export async function seedReviews(prisma: PrismaClient) {
  logStart('reviews');

  const now = new Date();

  const eligibleMemberPackages = await prisma.memberPackage.findMany({
    where: { status: 'expired' },
    select: { id: true, member_id: true, end_date: true },
  });

  // Only member packages whose end_date falls within the review window
  // (end_date <= now <= end_date + 14 days) are eligible — mirrors
  // ReviewsService.create()'s own validation.
  const withinWindow = eligibleMemberPackages.filter((mp) => {
    const windowEnd = new Date(mp.end_date);
    windowEnd.setDate(windowEnd.getDate() + REVIEW_WINDOW_DAYS);
    return mp.end_date <= now && now <= windowEnd;
  });

  if (withinWindow.length === 0) {
    console.log(
      '✓ No expired member packages fall within the 14-day review window, skipping reviews',
    );
    return;
  }

  const comments = [
    'Gym-nya bersih dan alatnya lengkap, worth it!',
    'Trainer-nya ramah dan komunikatif, banyak bantu progress latihan.',
    'Fasilitas oke, tapi rame banget pas jam pulang kerja.',
    'Pelayanan bagus, lokasi strategis, bakal perpanjang lagi.',
    'Alat-alatnya lumayan lengkap, cuma AC-nya kadang kurang dingin.',
  ];

  let totalCreated = 0;

  for (const mp of withinWindow) {
    const existing = await prisma.review.findUnique({
      where: { member_package_id: mp.id },
    });
    if (existing) continue;

    await prisma.review.create({
      data: {
        member_id: mp.member_id,
        member_package_id: mp.id,
        rating: faker.number.int({ min: 3, max: 5 }),
        comment: faker.helpers.arrayElement(comments),
        is_published: faker.datatype.boolean(0.7), // 70% chance published
      },
    });
    
    totalCreated++;
  }

  logDone('reviews', `${totalCreated} reviews seeded (out of ${withinWindow.length} eligible member packages)`);
}