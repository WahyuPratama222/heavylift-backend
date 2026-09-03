import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';
import { logStart, logDone } from '../log.util';

export async function seedMembers(prisma: PrismaClient) {
  logStart('members');

  const totalMembers = 15;
  const defaultPassword = await bcrypt.hash('password123', 10);
  let totalCreated = 0; // Renamed to totalCreated for consistency across seeders

  for (let i = 1; i <= totalMembers; i++) {
    // Deterministic email — guarantees idempotency across runs regardless
    // of faker's internal RNG state, unlike faker-generated emails which
    // aren't reliably reproducible between separate process invocations.
    const email = `dummy-member-${i}@heavylift.dev`;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) continue;

    const gender = faker.helpers.arrayElement(['male', 'female'] as const);
    const firstName = faker.person.firstName(gender);
    const lastName = faker.person.lastName();
    const fullName = `${firstName} ${lastName}`;

    await prisma.user.create({
      data: {
        email,
        password: defaultPassword,
        role: 'member',
        member: {
          create: {
            name: fullName,
            phone: `08${faker.string.numeric(10)}`,
            gender,
            date_of_birth: faker.date.birthdate({ min: 18, max: 55, mode: 'age' }),
            address: faker.location.streetAddress(),
            photo_url: faker.image.avatarGitHub(),
          },
        },
      },
    });
    
    totalCreated++;
  }

  logDone('members', `${totalCreated} new members created (${totalMembers} total, password: "password123")`);
}