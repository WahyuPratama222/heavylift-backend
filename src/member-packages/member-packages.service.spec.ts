import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { MemberPackagesService } from './member-packages.service';
import { PrismaService } from '../prisma/prisma.service';
import { XenditService } from '../xendit/xendit.service';
import { Prisma } from '@prisma/client';

describe('MemberPackagesService', () => {
  let service: MemberPackagesService;
  let prisma: any;
  let xendit: any;

  const userId = 'user-1';
  const userEmail = 'wahyu@gmail.com';
  const memberId = 'member-1';
  const packageId = 'package-1';

  const makeMember = (overrides = {}) => ({
    id: memberId,
    user_id: userId,
    deleted_at: null,
    ...overrides,
  });


  const makePackage = (overrides = {}) => ({
    id: packageId,
    name: 'Bulanan Hemat',
    price: new Prisma.Decimal(100000),
    duration_days: 30,
    ...overrides,
  });

  beforeEach(async () => {
    prisma = {
      member: { findUnique: jest.fn() },
      package: { findUnique: jest.fn() },
      memberPackage: {
        findFirst: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      payment: { create: jest.fn() },
      $transaction: jest.fn(),
    };

    xendit = {
      createInvoice: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemberPackagesService,
        { provide: PrismaService, useValue: prisma },
        { provide: XenditService, useValue: xendit },
      ],
    }).compile();

    service = module.get(MemberPackagesService);
    jest.resetAllMocks();
  });

  describe('create', () => {
    it('creates a member package and generates an invoice', async () => {
      prisma.member.findUnique.mockResolvedValueOnce(makeMember());
      prisma.package.findUnique.mockResolvedValueOnce(makePackage());
      prisma.memberPackage.findFirst.mockResolvedValueOnce(null);
      prisma.memberPackage.create.mockResolvedValueOnce({
        id: 'mp-1',
        member_id: memberId,
        package_id: packageId,
        status: 'pending_payment',
      });
      xendit.createInvoice.mockResolvedValueOnce({
        id: 'xnd-invoice-1',
        invoiceUrl: 'https://checkout-staging.xendit.co/web/xnd-invoice-1',
      });
      prisma.payment.create.mockResolvedValueOnce({
        id: 'payment-1',
        amount: new Prisma.Decimal(100000),
        status: 'pending',
        xendit_invoice_url: 'https://checkout-staging.xendit.co/web/xnd-invoice-1',
      });

      const result = await service.create(userId, userEmail, {
        package_id: packageId,
      });

      expect(result.package.price).toBe(100000);
      expect(typeof result.package.price).toBe('number');
      expect(result.payment.amount).toBe(100000);
      expect(typeof result.payment.amount).toBe('number');

      expect(xendit.createInvoice).toHaveBeenCalledWith(
        expect.objectContaining({ externalId: 'mp-1', amount: 100000 }),
      );
      expect(result.payment.xendit_invoice_url).toBe(
        'https://checkout-staging.xendit.co/web/xnd-invoice-1',
      );
    });

    it('throws NotFoundException when member profile does not exist', async () => {
      prisma.member.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.create(userId, userEmail, { package_id: packageId }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when member has been soft-deleted', async () => {
      prisma.member.findUnique.mockResolvedValueOnce(
        makeMember({ deleted_at: new Date() }),
      );

      await expect(
        service.create(userId, userEmail, { package_id: packageId }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when package does not exist', async () => {
      prisma.member.findUnique.mockResolvedValueOnce(makeMember());
      prisma.package.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.create(userId, userEmail, { package_id: packageId }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when member already has an active or pending package', async () => {
      prisma.member.findUnique.mockResolvedValueOnce(makeMember());
      prisma.package.findUnique.mockResolvedValueOnce(makePackage());
      prisma.memberPackage.findFirst.mockResolvedValueOnce({
        id: 'existing-mp',
        status: 'active',
      });

      await expect(
        service.create(userId, userEmail, { package_id: packageId }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findMy', () => {
    it('returns paginated member packages for the resolved member', async () => {
      prisma.member.findUnique.mockResolvedValueOnce(makeMember());
      prisma.$transaction.mockResolvedValueOnce([[{ id: 'mp-1' }], 1]);

      const result = await service.findMy(userId, {} as any);

      expect(prisma.memberPackage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { member_id: memberId } }),
      );
      expect(result.data).toEqual([{ id: 'mp-1' }]);
    });

    it('throws NotFoundException when member profile does not exist', async () => {
      prisma.member.findUnique.mockResolvedValueOnce(null);

      await expect(service.findMy(userId, {} as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('returns all member packages paginated', async () => {
      prisma.$transaction.mockResolvedValueOnce([[{ id: 'mp-1' }], 1]);

      const result = await service.findAll({} as any);

      expect(result.data).toEqual([{ id: 'mp-1' }]);
    });
  });
});