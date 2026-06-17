import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenPayload } from '../../auth/token-payload.interface';

interface PaintingOwnerRequest {
  params: {
    paintingId?: string;
  };
  user?: TokenPayload;
}

@Injectable()
export class PaintingOwnerGuard implements CanActivate {
  constructor(private readonly prismaService: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<PaintingOwnerRequest>();
    const paintingId = request.params.paintingId;
    const userId = request.user?.userId;

    if (!paintingId || !userId) {
      throw new ForbiddenException(
        'Only the user who created the painting can update it',
      );
    }

    const painting = await this.prismaService.painting.findUnique({
      where: { id: paintingId },
      select: { userId: true },
    });

    if (!painting) {
      throw new NotFoundException('Painting not found');
    }

    if (painting.userId !== userId) {
      throw new ForbiddenException(
        'Only the user who created the painting can update it',
      );
    }

    return true;
  }
}
