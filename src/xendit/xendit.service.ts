import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Xendit } from 'xendit-node';

@Injectable()
export class XenditService {
  private readonly xenditClient: Xendit;

  constructor(private readonly config: ConfigService) {
    const secretKey = this.config.get<string>('XENDIT_SECRET_KEY');

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

    try {
      return await Invoice.createInvoice({
        data: {
          externalId: params.externalId,
          amount: params.amount,
          description: params.description,
          payerEmail: params.payerEmail,
          currency: 'IDR',
        },
      });
    } catch (error) {
      throw new ServiceUnavailableException(
        'Failed to create payment invoice, please try again',
      );
    }
  }
}