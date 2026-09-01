import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: any;
  let config: any;

  const validToken = 'valid-callback-token';

  beforeEach(async () => {
    prisma = {
      payment: {
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      memberPackage: {
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    config = {
      get: jest.fn().mockReturnValue(validToken),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get(PaymentsService);
    jest.resetAllMocks();
    config.get.mockReturnValue(validToken);
  });

  describe('handleWebhook', () => {
    it('throws UnauthorizedException when callback token is invalid', async () => {
      await expect(
        service.handleWebhook('wrong-token', { id: 'inv-1', status: 'PAID' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns a message without updating anything when payment is not found', async () => {
      prisma.payment.findUnique.mockResolvedValueOnce(null);

      const result = await service.handleWebhook(validToken, {
        id: 'inv-unknown',
        status: 'PAID',
      });

      expect(result).toEqual({ message: 'Webhook received' });
      expect(prisma.payment.update).not.toHaveBeenCalled();
    });

    it('updates payment and member package to paid/active when status is PAID', async () => {
      prisma.payment.findUnique.mockResolvedValueOnce({
        id: 'payment-1',
        member_package_id: 'mp-1',
        xendit_invoice_id: 'inv-1',
      });

      await service.handleWebhook(validToken, {
        id: 'inv-1',
        status: 'PAID',
        payment_method: 'EWALLET',
        paid_at: '2026-08-26T06:07:00.248Z',
      });

      expect(prisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'payment-1' },
          data: expect.objectContaining({
            status: 'paid',
            payment_method: 'EWALLET',
          }),
        }),
      );
      expect(prisma.memberPackage.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'mp-1' },
          data: { status: 'active' },
        }),
      );
    });

    it('updates payment and member package to failed/cancelled when status is EXPIRED', async () => {
      prisma.payment.findUnique.mockResolvedValueOnce({
        id: 'payment-1',
        member_package_id: 'mp-1',
        xendit_invoice_id: 'inv-1',
      });

      const result = await service.handleWebhook(validToken, {
        id: 'inv-1',
        status: 'EXPIRED',
      });

      expect(prisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'payment-1' },
          data: { status: 'failed' },
        }),
      );
      expect(prisma.memberPackage.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'mp-1' },
          data: { status: 'cancelled' },
        }),
      );
      expect(result).toEqual({ message: 'Webhook received' });
    });

    it('does not update anything when status is PENDING or unrecognized', async () => {
      prisma.payment.findUnique.mockResolvedValueOnce({
        id: 'payment-1',
        member_package_id: 'mp-1',
        xendit_invoice_id: 'inv-1',
      });

      const result = await service.handleWebhook(validToken, {
        id: 'inv-1',
        status: 'PENDING',
      });

      expect(prisma.payment.update).not.toHaveBeenCalled();
      expect(prisma.memberPackage.update).not.toHaveBeenCalled();
      expect(result).toEqual({ message: 'Webhook received' });
    });
  });

  describe('findAll', () => {
    it('returns paginated payments with amount converted to number', async () => {
      prisma.$transaction.mockResolvedValueOnce([
        [{ id: 'payment-1', amount: new Prisma.Decimal('150000.00') }],
        1,
      ]);

      const result = await service.findAll({} as any);

      expect(result.data).toEqual([{ id: 'payment-1', amount: 150000 }]);
      expect(typeof result.data[0].amount).toBe('number');
    });

    it('uses page and limit from query when provided', async () => {
      prisma.$transaction.mockResolvedValueOnce([[], 0]);

      await service.findAll({ page: 2, limit: 5 } as any);

      expect(prisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 5 }),
      );
    });
  });

  describe('findOne', () => {
    it('returns a payment with its relations and amount converted to number', async () => {
      prisma.payment.findUnique.mockResolvedValueOnce({
        id: 'payment-1',
        amount: new Prisma.Decimal('150000.00'),
      });

      const result = await service.findOne('payment-1');

      expect(result).toEqual({ id: 'payment-1', amount: 150000 });
      expect(typeof result.amount).toBe('number');
    });

    it('throws NotFoundException when payment does not exist', async () => {
      prisma.payment.findUnique.mockResolvedValueOnce(null);

      await expect(service.findOne('payment-x')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});