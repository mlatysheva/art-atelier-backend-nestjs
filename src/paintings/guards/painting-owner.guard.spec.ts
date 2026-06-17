import {
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaintingOwnerGuard } from './painting-owner.guard';

describe('PaintingOwnerGuard', () => {
  let guard: PaintingOwnerGuard;
  let prismaService: {
    painting: {
      findUnique: jest.Mock;
    };
  };

  const createContext = (
    paintingId: string | undefined,
    userId: string | undefined,
  ) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          params: { paintingId },
          user: userId ? { userId } : undefined,
        }),
      }),
    }) as ExecutionContext;

  beforeEach(() => {
    prismaService = {
      painting: {
        findUnique: jest.fn(),
      },
    };
    guard = new PaintingOwnerGuard(prismaService as unknown as PrismaService);
  });

  it('allows the user who owns the painting', async () => {
    prismaService.painting.findUnique.mockResolvedValue({ userId: 'user_123' });

    await expect(
      guard.canActivate(createContext('painting_123', 'user_123')),
    ).resolves.toBe(true);

    expect(prismaService.painting.findUnique).toHaveBeenCalledWith({
      where: { id: 'painting_123' },
      select: { userId: true },
    });
  });

  it('rejects a user who does not own the painting', async () => {
    prismaService.painting.findUnique.mockResolvedValue({ userId: 'user_123' });

    await expect(
      guard.canActivate(createContext('painting_123', 'user_456')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects missing paintings', async () => {
    prismaService.painting.findUnique.mockResolvedValue(null);

    await expect(
      guard.canActivate(createContext('painting_123', 'user_123')),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
