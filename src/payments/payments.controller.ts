import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { Public } from '../common/decorators/public.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { XenditWebhookDto } from './dto/xendit-webhook.dto';
import { OwnerEndpoint } from '../common/decorators/owner-endpoint.decorator';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @ApiOperation({
    summary: 'Xendit webhook callback (internal — not for manual use)',
    description:
      'Called by Xendit when an invoice status changes. PAID activates the member package; EXPIRED cancels it. Both DB updates run in a single transaction.',
  })
  @ApiHeader({ name: 'x-callback-token', description: "Xendit's webhook verification token" })
  @ApiResponse({ status: 200, description: 'Webhook received (always returns 200, even for unrecognized invoices)' })
  @ApiResponse({ status: 401, description: 'Invalid callback token' })
  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  handleWebhook(
    @Headers('x-callback-token') callbackToken: string,
    @Body() dto: XenditWebhookDto,
  ) {
    return this.paymentsService.handleWebhook(callbackToken, dto);
  }

  @ApiOperation({ summary: 'List all payments (owner only)' })
  @ApiResponse({ status: 200, description: 'Paginated list of payments' })
  @OwnerEndpoint()
  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.paymentsService.findAll(query);
  }

  @ApiOperation({ summary: 'Get a single payment by id, with member/package details (owner only)' })
  @ApiResponse({ status: 200, description: 'Payment details' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @OwnerEndpoint()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }
}