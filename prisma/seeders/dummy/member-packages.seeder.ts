import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { logStart, logDone } from '../log.util';

export async function seedMemberPackages(prisma: PrismaClient) {
  logStart('member-packages');

  const members = await prisma.member.findMany({
    select: { id: true },
    orderBy: { created_at: 'asc' },
  });

  const packages = await prisma.package.findMany({
    select: { id: true, price: true, duration_days: true },
  });

  if (members.length === 0 || packages.length === 0) {
    throw new Error(
      'No members or packages found — make sure seedMembers and seedPackages run first',
    );
  }

  const membersToAssign = members.slice(0, members.length - 3);

  const statuses: Array<'active' | 'pending_payment' | 'expired' | 'cancelled'> = [
    'active', 'active', 'active', 'pending_payment', 'expired', 'expired', 'cancelled',
  ];

  let expiredCount = 0;
  let totalCreated = 0; // Disamakan jadi totalCreated supaya konsisten dengan seeder lain

  for (const [index, member] of membersToAssign.entries()) {
    const existing = await prisma.memberPackage.findFirst({
      where: { member_id: member.id },
    });
    if (existing) continue;

    const pkg = faker.helpers.arrayElement(packages);
    const status = statuses[index % statuses.length];

    const { startDate, endDate } = computeDates(status, pkg.duration_days, expiredCount);
    if (status === 'expired') expiredCount++;

    const memberPackage = await prisma.memberPackage.create({
      data: {
        member_id: member.id,
        package_id: pkg.id,
        start_date: startDate,
        end_date: endDate,
        status,
      },
    });

    const paymentStatus = status === 'active' || status === 'expired' ? 'paid'
      : status === 'cancelled' ? 'failed'
      : 'pending';

    await prisma.payment.create({
      data: {
        member_package_id: memberPackage.id,
        amount: pkg.price,
        status: paymentStatus,
        payment_method: paymentStatus === 'paid' ? faker.helpers.arrayElement(['EWALLET', 'BANK_TRANSFER', 'CREDIT_CARD']) : null,
        xendit_invoice_id: `dummy-inv-${faker.string.alphanumeric(12)}`,
        xendit_invoice_url: paymentStatus !== 'failed' ? faker.internet.url() : null,
        paid_at: paymentStatus === 'paid' ? startDate : null,
      },
    });

    totalCreated++;
  }

  logDone('member-packages', `${totalCreated} new member packages seeded (${membersToAssign.length} eligible, ${members.length - membersToAssign.length} left as no_package)`);
}
function computeDates(
  status: 'active' | 'pending_payment' | 'expired' | 'cancelled',
  durationDays: number,
  expiredCount: number,
): { startDate: Date; endDate: Date } {
  const now = new Date();

  if (status === 'expired') {
    // Alternate: first expired package lands inside the 14-day review
    // window (5 days ago), the next lands outside it (25 days ago) —
    // guarantees seedReviews always has at least one eligible candidate
    // while still keeping some realistic "review window passed" cases.
    const daysAgo = expiredCount % 2 === 0 ? 5 : 25;
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() - daysAgo);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - durationDays);
    return { startDate, endDate };
  }

  if (status === 'active' || status === 'pending_payment') {
    // Started recently, still running.
    const startDate = faker.date.recent({ days: 15 });
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + durationDays);
    return { startDate, endDate };
  }

  // cancelled — dates don't matter for any business rule, keep it simple.
  const startDate = faker.date.recent({ days: 30 });
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + durationDays);
  return { startDate, endDate };
}