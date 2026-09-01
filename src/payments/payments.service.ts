import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Payment } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { paginate } from '../common/utils/paginate.util';
import { toNumber } from '../common/utils/decimal.util';
import { XenditWebhookDto } from './dto/xendit-webhook.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async handleWebhook(callbackToken: string, dto: XenditWebhookDto) {
    if (callbackToken !== this.config.get<string>('XENDIT_CALLBACK_TOKEN')) {
      throw new UnauthorizedException('Invalid callback token');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { xendit_invoice_id: dto.id },
    });

    if (!payment) {
      // Return success anyway so Xendit doesn't keep retrying
      // for an invoice we don't recognize.
      return { message: 'Webhook received' };
    }

    switch (dto.status) {
      case 'PAID':
        await this.prisma.$transaction([
          this.prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'paid',
              payment_method: dto.payment_method,
              paid_at: dto.paid_at ? new Date(dto.paid_at) : new Date(),
            },
          }),
          this.prisma.memberPackage.update({
            where: { id: payment.member_package_id },
            data: { status: 'active' },
          }),
        ]);
        break;

      case 'EXPIRED':
        await this.prisma.$transaction([
          this.prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'failed' },
          }),
          this.prisma.memberPackage.update({
            where: { id: payment.member_package_id },
            data: { status: 'cancelled' },
          }),
        ]);
        break;

      // PENDING and other unrecognized statuses are intentionally ignored —
      // no state changes are required on our end.
      default:
        break;
    }

    return { message: 'Webhook received' };
  }

  async findAll(query: PaginationDto) {
    const result = await paginate(
      this.prisma,
      this.prisma.payment,
      { orderBy: { created_at: 'desc' } },
      query,
    );

    return {
      ...result,
      data: result.data.map(this.serialize),
    };
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        member_package: {
          include: {
            member: { select: { id: true, name: true } },
            package: { select: { name: true } },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return this.serialize(payment);
  }

  private serialize(payment: Payment & Record<string, any>) {
    return {
      ...payment,
      amount: toNumber(payment.amount),
    };
  }
}