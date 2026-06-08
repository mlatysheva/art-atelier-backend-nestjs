import { Body, Controller, Headers, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TokenPayload } from '../auth/token-payload.interface';
import { CreateSessionRequest } from './dto/create-session.request';
import { CheckoutService, CheckoutSession } from './checkout.service';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('session')
  @UseGuards(JwtAuthGuard)
  async createSession(
    @Body() request: CreateSessionRequest,
    @CurrentUser() user: TokenPayload,
  ): Promise<CheckoutSession> {
    return this.checkoutService.createSession(request.paintingId, user.userId);
  }

  @Post('webhook')
  async handleCheckoutWebhook(
    @Body() body: Buffer,
    @Headers('stripe-signature') signature?: string,
  ): Promise<void> {
    return await this.checkoutService.handleCheckoutWebhook(body, signature);
  }
}
