import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { XenditService } from '../xendit/xendit.service';
import { CreateMemberPackageDto } from './dto/create-member-package.dto';

@Injectable()
export class MemberPackagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly xendit: XenditService,
  ) {}

  private async resolveMemberId(userId: string): Promise<string> {
    const member = await this.prisma.member.findUnique({
      where: { user_id: userId },
    });

    if (!member || member.deleted_at) {
      throw new NotFoundException('Member not found');
    }

    return member.id;
  }

  async create(userId: string, userEmail: string, dto: CreateMemberPackageDto) {
    const memberId = await this.resolveMemberId(userId);

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
      package: { name: pkg.name, price: pkg.price },
      payment: {
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        xendit_invoice_url: payment.xendit_invoice_url,
      },
    };
  }

  async findMy(userId: string) {
    const memberId = await this.resolveMemberId(userId);

    return this.prisma.memberPackage.findMany({
      where: { member_id: memberId },
      orderBy: { created_at: 'desc' },
      include: {
        package: { select: { name: true, price: true } },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            payment_method: true,
            paid_at: true,
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.memberPackage.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        member: { select: { id: true, name: true } },
        package: { select: { name: true, price: true } },
        payments: {
          select: { id: true, amount: true, status: true, paid_at: true },
        },
      },
    });
  }
}