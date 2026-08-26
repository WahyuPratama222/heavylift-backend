import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Post('webhook')
  handleWebhook(
    @Headers('x-callback-token') callbackToken: string,
    @Body() payload: any,
  ) {
    return this.paymentsService.handleWebhook(callbackToken, payload);
  }

  @Roles('owner')
  @Get()
  findAll() {
    return this.paymentsService.findAll();
  }

  @Roles('owner')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }
}