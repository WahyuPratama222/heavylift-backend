import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: any;

  const validToken = 'valid-callback-token';

  beforeEach(async () => {
    process.env.XENDIT_CALLBACK_TOKEN = validToken;

    prisma = {
      payment: {
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      memberPackage: {
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(PaymentsService);
    jest.resetAllMocks();
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

    it('does not update anything when status is not PAID', async () => {
      prisma.payment.findUnique.mockResolvedValueOnce({
        id: 'payment-1',
        member_package_id: 'mp-1',
        xendit_invoice_id: 'inv-1',
      });

      const result = await service.handleWebhook(validToken, {
        id: 'inv-1',
        status: 'EXPIRED',
      });

      expect(prisma.payment.update).not.toHaveBeenCalled();
      expect(prisma.memberPackage.update).not.toHaveBeenCalled();
      expect(result).toEqual({ message: 'Webhook received' });
    });
  });

  describe('findAll', () => {
    it('returns all payments', async () => {
      prisma.payment.findMany.mockResolvedValueOnce([{ id: 'payment-1' }]);

      const result = await service.findAll();

      expect(result).toEqual([{ id: 'payment-1' }]);
    });
  });

  describe('findOne', () => {
    it('returns a payment with its relations', async () => {
      prisma.payment.findUnique.mockResolvedValueOnce({ id: 'payment-1' });

      const result = await service.findOne('payment-1');

      expect(result).toEqual({ id: 'payment-1' });
    });

    it('throws NotFoundException when payment does not exist', async () => {
      prisma.payment.findUnique.mockResolvedValueOnce(null);

      await expect(service.findOne('payment-x')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});