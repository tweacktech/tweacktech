import {
  Controller,
  Post,
  Get,
  Query,
  UseGuards,
  Logger,
  UseInterceptors,
  UploadedFile,
  Body,
} from '@nestjs/common';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadedFileData } from './types/uploaded-file.type';

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  private readonly logger = new Logger(MediaController.name);

  constructor(private mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      // Memory storage keeps uploads working on read-only/serverless hosts
      // (Vercel/Lambda) where only /tmp is writable. The buffer is streamed to
      // Cloudinary by MediaService.
      storage: memoryStorage(),
      limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
    }),
  )
  async upload(
    @UploadedFile() file: UploadedFileData,
    @Body() body: { folder: string },
    @CurrentUser() user: any,
  ) {
    return this.mediaService.uploadFile(file, body.folder || 'uploads', user.sub);
  }

  @Get('my')
  async getMyUploads(@CurrentUser() user: any, @Query() query: any) {
    return this.mediaService.getUserUploads(user.sub, {
      page: query.page ? parseInt(query.page, 10) : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
      folder: query.folder,
    });
  }
}
