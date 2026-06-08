import { Test, TestingModule } from '@nestjs/testing';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';

describe('CheckoutController', () => {
  let controller: CheckoutController;
  let checkoutService: { createSession: jest.Mock };

  beforeEach(async () => {
    checkoutService = {
      createSession: jest.fn().mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.test/session',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CheckoutController],
      providers: [
        {
          provide: CheckoutService,
          useValue: checkoutService,
        },
      ],
    }).compile();

    controller = module.get<CheckoutController>(CheckoutController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('creates checkout session for the requested painting and current user', async () => {
    const session = await controller.createSession(
      { paintingId: 'painting_123' },
      { userId: 'user_456' },
    );

    expect(session).toEqual({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.test/session',
    });
    expect(checkoutService.createSession).toHaveBeenCalledWith(
      'painting_123',
      'user_456',
    );
  });
});
