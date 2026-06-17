import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Delete,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePaintingRequest } from './dto/create-painting.request';
import { CurrentUser } from '../auth/current-user.decorator';
import { TokenPayload } from '../auth/token-payload.interface';
import { PaintingsService } from './paintings.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'node:path';
import * as fs from 'fs';
import * as path from 'path';
import { UpdatePaintingRequest } from './dto/update-painting.request';
import { PaintingOwnerGuard } from './guards/painting-owner.guard';

@Controller('paintings')
export class PaintingsController {
  constructor(private readonly paintingsService: PaintingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createPainting(
    @Body() body: CreatePaintingRequest,
    @CurrentUser() user: TokenPayload,
  ): Promise<any> {
    return this.paintingsService.createPainting(body, user.userId);
  }

  @Post(':paintingId/images')
  @UseGuards(JwtAuthGuard, PaintingOwnerGuard)
  @UseInterceptors(
    FilesInterceptor('image', 10, {
      storage: diskStorage({
        destination: (req, _, cb) => {
          const paintingId = req.params.paintingId;
          const uploadPath = path.join(
            'public',
            'images',
            'paintings',
            paintingId as string,
          );

          // Create the folder for the images if it doesn't exist
          fs.mkdirSync(uploadPath, { recursive: true });

          cb(null, uploadPath);
        },
        filename: (_, file, callback) => {
          // Decode the filename from latin1 to utf8, relevant for Cyrillic characters
          const buffer = Buffer.from(file.originalname, 'latin1');
          const decodedName = buffer.toString('utf8');

          const ext = extname(decodedName);
          const name = decodedName.replace(ext, '');

          const finalName = `${name}${ext}`;

          callback(null, finalName);
        },
      }),
    }),
  )
  uploadPaintingImages(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 500000 }),
          new FileTypeValidator({
            fileType: 'image/jpeg|image/png|image/jpg',
          }),
        ],
      }),
    )
    files: Express.Multer.File[],
  ) {}

  /**
   * Endpoint to replace images of a painting, including deleting and adding new ones.
   * @param paintingId
   * @param newFiles
   * @param imagesToKeep
   * @returns
   */
  @Patch(':paintingId/images')
  @UseGuards(JwtAuthGuard, PaintingOwnerGuard)
  @UseInterceptors(
    FilesInterceptor('image', 10, {
      storage: diskStorage({
        destination: (req, _, cb) => {
          const paintingId = req.params.paintingId;
          const uploadPath = path.join(
            'public',
            'images',
            'paintings',
            paintingId as string,
          );

          // Create the folder for the images if it doesn't exist
          fs.mkdirSync(uploadPath, { recursive: true });

          cb(null, uploadPath);
        },
        filename: (_, file, callback) => {
          // Decode the filename from latin1 to utf8, relevant for Cyrillic characters
          const buffer = Buffer.from(file.originalname, 'latin1');
          const decodedName = buffer.toString('utf8');

          const ext = extname(decodedName);
          const name = decodedName.replace(ext, '');

          const finalName = `${name}${ext}`;

          callback(null, finalName);
        },
      }),
    }),
  )
  async replacePaintingImages(
    @Param('paintingId') paintingId: string,
    @UploadedFiles() newFiles: Express.Multer.File[],
    @Body('imagesToKeep') imagesToKeep?: string | string[],
  ) {
    const keepList = Array.isArray(imagesToKeep)
      ? imagesToKeep
      : imagesToKeep
        ? [imagesToKeep]
        : [];
    return await this.paintingsService.replaceImages(
      paintingId,
      newFiles,
      keepList,
    );
  }

  @Get()
  async getPaintings(@Query('status') status: string) {
    return this.paintingsService.getPaintings(status);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard)
  async getPaintingsOfLoggedUser(@CurrentUser() user: TokenPayload) {
    return this.paintingsService.getPaintingsByUser(user.userId);
  }

  @Get(':paintingId')
  async getPainting(@Param('paintingId') paintingId: string) {
    return await this.paintingsService.getPainting(paintingId);
  }

  @Delete(':paintingId')
  @UseGuards(JwtAuthGuard)
  async deletePainting(
    @Param('paintingId') id: string,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.paintingsService.delete(id, user.userId);
  }

  @Patch(':paintingId')
  @UseGuards(JwtAuthGuard)
  async updatePainting(
    @Param('paintingId') id: string,
    @Body() body: Partial<UpdatePaintingRequest>,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.paintingsService.updatePainting(id, body, user.userId);
  }
}
