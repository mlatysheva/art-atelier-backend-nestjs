import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import Stripe from 'stripe';
import { PaintingsService } from '../paintings/paintings.service';
import { CheckoutService } from './checkout.service';

describe('CheckoutService', () => {
  let service: CheckoutService;
  let stripe: Stripe;
  let paintingsService: { getPainting: jest.Mock; markPaintingSold: jest.Mock };
  let checkoutSessionCreate: jest.Mock;

  beforeEach(async () => {
    const webhookSecret = 'whsec_test_secret';
    stripe = new Stripe('sk_test_dummy');
    checkoutSessionCreate = jest.fn().mockResolvedValue({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.test/session',
    });
    stripe.checkout.sessions.create = checkoutSessionCreate;

    paintingsService = {
      getPainting: jest.fn().mockResolvedValue({
        id: 'painting_123',
        title: 'Test Painting',
        price: 450,
      }),
      markPaintingSold: jest.fn(),
    };

    const configService = {
      getOrThrow: jest.fn((key: string) => {
        if (key === 'STRIPE_WEBHOOK_SECRET') return webhookSecret;
        if (key === 'STRIPE_SUCCESS_URL') return 'http://localhost:3000';
        if (key === 'STRIPE_CANCEL_URL') return 'http://localhost:3000';
        throw new Error(`Unexpected config key: ${key}`);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckoutService,
        { provide: Stripe, useValue: stripe },
        { provide: PaintingsService, useValue: paintingsService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<CheckoutService>(CheckoutService);
  });

  it('creates a Stripe checkout session with painting and user metadata', async () => {
    const session = await service.createSession('painting_123', 'user_456');

    expect(session).toEqual({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.test/session',
    });
    expect(paintingsService.getPainting).toHaveBeenCalledWith('painting_123');
    expect(checkoutSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: {
          paintingId: 'painting_123',
          userId: 'user_456',
        },
        line_items: [
          expect.objectContaining({
            price_data: expect.objectContaining({
              currency: 'eur',
              unit_amount: 45000,
              product_data: {
                name: 'Test Painting',
              },
            }),
            quantity: 1,
          }),
        ],
        mode: 'payment',
        success_url: 'http://localhost:3000',
        cancel_url: 'http://localhost:3000',
      }),
    );
  });

  it('marks a painting as sold on checkout.session.completed', async () => {
    const payload = JSON.stringify({
      id: 'evt_test_1',
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: {
            paintingId: 'painting_123',
          },
        },
      },
    });

    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: 'whsec_test_secret',
    });

    await service.handleCheckoutWebhook(Buffer.from(payload), signature);

    expect(paintingsService.markPaintingSold).toHaveBeenCalledWith(
      'painting_123',
    );
  });

  it('rejects requests without a Stripe signature', async () => {
    const payload = JSON.stringify({ type: 'checkout.session.completed' });

    await expect(
      service.handleCheckoutWebhook(Buffer.from(payload)),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
