import { Injectable } from '@nestjs/common';
import { Xendit } from 'xendit-node';

@Injectable()
export class XenditService {
  private readonly xenditClient: Xendit;

  constructor() {
    const secretKey = process.env.XENDIT_SECRET_KEY;

    if (!secretKey) {
        throw new Error('XENDIT_SECRET_KEY is not defined in environment variables');
    }

    this.xenditClient = new Xendit({ secretKey });
    }
    
  async createInvoice(params: {
    externalId: string;
    amount: number;
    description: string;
    payerEmail?: string;
  }) {
    const { Invoice } = this.xenditClient;

    return Invoice.createInvoice({
      data: {
        externalId: params.externalId,
        amount: params.amount,
        description: params.description,
        payerEmail: params.payerEmail,
        currency: 'IDR',
      },
    });
  }
}