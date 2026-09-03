import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { logDone, logStart } from '../log.util';

export async function seedOwner(prisma: PrismaClient, config: ConfigService) {
  logStart('owner');

  const email = config.get<string>('OWNER_EMAIL');
  const password = config.get<string>('OWNER_PASSWORD');

  if (!email || !password) {
    throw new Error(
      'OWNER_EMAIL and OWNER_PASSWORD must be set — refusing to seed owner with a default password',
    );
  }

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

  logDone('owner', `Owner account seeded (${email})`);
}