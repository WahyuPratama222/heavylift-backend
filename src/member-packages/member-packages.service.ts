import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { XenditService } from '../xendit/xendit.service';
import { CreateMemberPackageDto } from './dto/create-member-package.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { paginate } from '../common/utils/paginate.util';
import { resolveMemberId } from '../common/helpers/resolve-member.helper';
import { toNumber } from '../common/utils/decimal.util';

function formatMemberPackage(mp: any) {
  return {
    ...mp,
    package: mp.package
      ? { ...mp.package, price: toNumber(mp.package.price) }
      : mp.package,
    payments: mp.payments
      ? mp.payments.map((p: any) => ({ ...p, amount: toNumber(p.amount) }))
      : mp.payments,
  };
}

@Injectable()
export class MemberPackagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly xendit: XenditService,
  ) {}

  async create(userId: string, userEmail: string, dto: CreateMemberPackageDto) {
    const memberId = await resolveMemberId(this.prisma, userId);

    const pkg = await this.prisma.package.findUnique({
      where: { id: dto.package_id },
    });

    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    const existing = await this.prisma.memberPackage.findFirst({
      where: {
        member_id: memberId,
        status: { in: ['active', 'pending_payment'] },
      },
    });

    if (existing) {
      throw new ConflictException(
        'You still have an active or pending package',
      );
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + pkg.duration_days);

    const memberPackage = await this.prisma.memberPackage.create({
      data: {
        member_id: memberId,
        package_id: pkg.id,
        start_date: startDate,
        end_date: endDate,
        status: 'pending_payment',
      },
    });

    const invoice = await this.xendit.createInvoice({
      externalId: memberPackage.id,
      amount: Number(pkg.price),
      description: `Payment for ${pkg.name}`,
      payerEmail: userEmail,
    });

    const payment = await this.prisma.payment.create({
      data: {
        member_package_id: memberPackage.id,
        amount: pkg.price,
        status: 'pending',
        xendit_invoice_id: invoice.id,
        xendit_invoice_url: invoice.invoiceUrl,
      },
    });

    return {
      ...memberPackage,
      package: { name: pkg.name, price: toNumber(pkg.price) },
      payment: {
        id: payment.id,
        amount: toNumber(payment.amount),
        status: payment.status,
        xendit_invoice_url: payment.xendit_invoice_url,
      },
    };
  }

  async findMy(userId: string, query: PaginationDto) {
    const memberId = await resolveMemberId(this.prisma, userId);

    const result = await paginate(
      this.prisma,
      this.prisma.memberPackage,
      {
        where: { member_id: memberId },
        orderBy: { created_at: 'desc' },
        include: {
          package: { select: { name: true, price: true } },
          payments: {
            select: { id: true, amount: true, status: true, payment_method: true, paid_at: true },
          },
        },
      },
      query,
    );

    return { ...result, data: result.data.map(formatMemberPackage) };
  }

  async findAll(query: PaginationDto) {
    const result = await paginate(
      this.prisma,
      this.prisma.memberPackage,
      {
        orderBy: { created_at: 'desc' },
        include: {
          member: { select: { id: true, name: true } },
          package: { select: { name: true, price: true } },
          payments: { select: { id: true, amount: true, status: true, paid_at: true } },
        },
      },
      query,
    );

    return { ...result, data: result.data.map(formatMemberPackage) };
  }
}