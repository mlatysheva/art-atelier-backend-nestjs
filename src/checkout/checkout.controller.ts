import { Body, Controller, Headers, Post } from '@nestjs/common';
import { CreateSessionRequest } from './dto/create-session.request';
import { CheckoutService, CheckoutSession } from './checkout.service';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('session')
  async createSession(
    @Body() request: CreateSessionRequest,
  ): Promise<CheckoutSession> {
    return this.checkoutService.createSession(request.paintingId);
  }

  @Post('webhook')
  async handleCheckoutWebhook(
    @Body() body: Buffer,
    @Headers('stripe-signature') signature?: string,
  ): Promise<void> {
    return await this.checkoutService.handleCheckoutWebhook(body, signature);
  }
}
