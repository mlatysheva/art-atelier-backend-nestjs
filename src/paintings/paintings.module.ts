import { Module } from '@nestjs/common';
import { PaintingsService } from './paintings.service';
import { PaintingsController } from './paintings.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PaintingsGateway } from './paintings.gateway';
import { AuthModule } from '../auth/auth.module';
import { PaintingOwnerGuard } from './guards/painting-owner.guard';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [PaintingsService, PaintingsGateway, PaintingOwnerGuard],
  controllers: [PaintingsController],
  exports: [PaintingsService],
})
export class PaintingsModule {}
