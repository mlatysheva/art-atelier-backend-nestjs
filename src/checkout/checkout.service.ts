import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { PaintingsService } from '../paintings/paintings.service';
import { ConfigService } from '@nestjs/config';

type StripeClient = InstanceType<typeof Stripe>;
export type CheckoutSession = Awaited<
  ReturnType<StripeClient['checkout']['sessions']['create']>
>;

@Injectable()
export class CheckoutService {
  constructor(
    @Inject(Stripe)
    private readonly stripe: StripeClient,
    private readonly paintingsService: PaintingsService,
    private readonly configService: ConfigService,
  ) {}

  async createSession(paintingId: string): Promise<CheckoutSession> {
    const painting = await this.paintingsService.getPainting(paintingId);
    return this.stripe.checkout.sessions.create({
      metadata: {
        paintingId: painting.id,
      },
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: painting.price * 100,
            product_data: {
              name: painting.title,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: this.configService.getOrThrow('STRIPE_SUCCESS_URL'),
      cancel_url: this.configService.getOrThrow('STRIPE_CANCEL_URL'),
    });
  }

  async handleCheckoutWebhook(
    rawBody: Buffer,
    signature?: string,
  ): Promise<void> {
    if (!signature) {
      throw new BadRequestException('Missing Stripe signature');
    }

    const event = this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      this.configService.getOrThrow('STRIPE_WEBHOOK_SECRET'),
    );

    if (event.type !== 'checkout.session.completed') {
      return;
    }

    const session = event.data.object;
    const paintingId = session.metadata?.paintingId;
    if (!paintingId) {
      return;
    }

    await this.paintingsService.markPaintingSold(paintingId);
  }
}
