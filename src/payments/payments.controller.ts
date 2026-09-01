import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { XenditWebhookDto } from './dto/xendit-webhook.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  handleWebhook(
    @Headers('x-callback-token') callbackToken: string,
    @Body() dto: XenditWebhookDto,
  ) {
    return this.paymentsService.handleWebhook(callbackToken, dto);
  }

  @Roles('owner')
  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.paymentsService.findAll(query);
  }

  @Roles('owner')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }
}