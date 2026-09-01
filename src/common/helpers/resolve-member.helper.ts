import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export async function resolveMemberId(
  prisma: PrismaService,
  userId: string,
): Promise<string> {
  const member = await prisma.member.findUnique({
    where: { user_id: userId },
  });

  if (!member || member.deleted_at) {
    throw new NotFoundException('Member not found');
  }

  return member.id;
}