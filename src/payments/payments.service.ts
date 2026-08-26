import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async handleWebhook(callbackToken: string, payload: any) {
    if (callbackToken !== process.env.XENDIT_CALLBACK_TOKEN) {
      throw new UnauthorizedException('Invalid callback token');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { xendit_invoice_id: payload.id },
    });

    if (!payment) {
      // Return success anyway so Xendit doesn't keep retrying
      // for an invoice we don't recognize.
      return { message: 'Webhook received' };
    }

    if (payload.status === 'PAID') {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'paid',
          payment_method: payload.payment_method,
          paid_at: payload.paid_at ? new Date(payload.paid_at) : new Date(),
        },
      });

      await this.prisma.memberPackage.update({
        where: { id: payment.member_package_id },
        data: { status: 'active' },
      });
    }

    return { message: 'Webhook received' };
  }

  async findAll() {
    return this.prisma.payment.findMany({
      orderBy: { created_at: 'desc' },
    });
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

    return payment;
  }
}