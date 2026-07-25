import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export async function seedOwner(prisma: PrismaClient) {
  const email = process.env.OWNER_EMAIL ?? 'owner@heavylift.com';
  const password = process.env.OWNER_PASSWORD ?? 'password123';

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      password: hashedPassword,
      role: 'owner',
    },
  });

  console.log('✓ Owner seeded');
}