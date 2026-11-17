import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse } from 'cloudinary';
import { UploadedFileData } from './types/uploaded-file.type';
import { randomUUID } from 'crypto';
import { mkdir, readFile, unlink, writeFile } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly cloudinaryReady: boolean;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    let cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME');
    let apiKey = this.config.get<string>('CLOUDINARY_API_KEY');
    let apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET');

    // Support the single-URL form: cloudinary://key:secret@cloud_name
    const cloudinaryUrl = this.config.get<string>('CLOUDINARY_URL');
    if (cloudinaryUrl && (!cloudName || !apiKey || !apiSecret)) {
      try {
        const parsed = new URL(cloudinaryUrl);
        cloudName = cloudName || parsed.hostname;
        apiKey = apiKey || decodeURIComponent(parsed.username);
        apiSecret = apiSecret || decodeURIComponent(parsed.password);
      } catch {
        this.logger.warn('CLOUDINARY_URL could not be parsed');
      }
    }

    this.cloudinaryReady = Boolean(cloudName && apiKey && apiSecret);
    if (this.cloudinaryReady) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
    } else {
      this.logger.warn(
        'Cloudinary is not fully configured — uploads will be stored on local disk.',
      );
    }
  }

  async uploadFile(file: UploadedFileData, folder: string, userId?: string) {
    if (!file) throw new BadRequestException('No file provided');

    const buffer = await this.bufferFor(file);
    if (!buffer) throw new BadRequestException('The uploaded file is empty');

    if (this.cloudinaryReady) {
      try {
        const result = await this.uploadToCloudinary(
          buffer,
          folder,
          file.mimetype,
        );
        const media = await this.record({
          filename: result.public_id,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size || buffer.length,
          url: result.secure_url,
          cloudinaryPublicId: result.public_id,
          resourceType: result.resource_type,
          folder,
          uploadedBy: userId,
        });
        return this.present(media);
      } catch (error) {
        this.logger.error(
          `Cloudinary upload failed, falling back to local disk: ${
            error instanceof Error ? error.message : error
          }`,
        );
      }
    }

    const saved = await this.saveLocally(buffer, file, folder);
    const media = await this.record({
      ...saved,
      uploadedBy: userId,
    });
    return this.present(media);
  }

  async getSignedUrl(
    publicId: string,
    resourceType: 'image' | 'video' | 'raw' = 'image',
  ) {
    if (!this.cloudinaryReady) {
      return { url: publicId.replace(/^local:/, '') };
    }
    const url = cloudinary.url(publicId, {
      resource_type: resourceType,
      sign_url: true,
      type: 'authenticated',
    });
    return { url };
  }

  async deleteFile(publicId: string) {
    if (publicId.startsWith('local:')) {
      try {
        await unlink(join(process.cwd(), publicId.replace(/^local:/, '')));
      } catch {
        // already gone
      }
      return { success: true };
    }
    if (this.cloudinaryReady) {
      await cloudinary.uploader.destroy(publicId);
    }
    return { success: true };
  }

  async getUserUploads(
    userId: string,
    params: { page?: number; limit?: number; folder?: string },
  ) {
    const page = params.page || 1;
    const limit = Math.min(params.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = { uploadedBy: userId };
    if (params.folder) where.folder = params.folder;

    const [files, total] = await this.prisma.$transaction([
      this.prisma.mediaFile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.mediaFile.count({ where }),
    ]);

    return {
      files,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  private async bufferFor(file: UploadedFileData): Promise<Buffer | null> {
    if (file.buffer && file.buffer.length > 0) return file.buffer;
    if (file.path) {
      try {
        return await readFile(file.path);
      } catch {
        return null;
      }
    }
    return null;
  }

  private uploadToCloudinary(
    buffer: Buffer,
    folder: string,
    mimeType?: string,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          // Browsers (and social crawlers) cannot render HEIC/AVIF uploads from
          // iPhones. Normalise image uploads to a universally readable JPG.
          ...(mimeType?.startsWith('image/') ? { format: 'jpg' } : {}),
        },
        (error, result) => {
          if (error || !result) reject(error || new Error('Empty upload result'));
          else resolve(result);
        },
      );
      stream.end(buffer);
    });
  }

  private async saveLocally(
    buffer: Buffer,
    file: UploadedFileData,
    folder: string,
  ): Promise<{
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    cloudinaryPublicId: string;
    resourceType: string;
    folder: string;
  }> {
    const safeFolder = (folder || 'uploads')
      .replace(/[^a-zA-Z0-9/_-]/g, '')
      .replace(/^\/+|\/+$/g, '');
    const dir = join(process.cwd(), 'uploads', safeFolder);
    await mkdir(dir, { recursive: true });

    const ext = (file.originalname.split('.').pop() || '').replace(/[^a-zA-Z0-9]/g, '');
    const filename = `${Date.now()}-${randomUUID().slice(0, 8)}${ext ? `.${ext}` : ''}`;
    const absolute = join(dir, filename);
    await writeFile(absolute, buffer);

    const apiUrl =
      this.config.get<string>('API_URL') ||
      `http://localhost:${this.config.get<string>('PORT') || 5000}`;
    const relativePath = `uploads/${safeFolder}/${filename}`;

    return {
      filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size || buffer.length,
      url: `${apiUrl.replace(/\/$/, '')}/${relativePath}`,
      cloudinaryPublicId: `local:${relativePath}`,
      resourceType: file.mimetype.startsWith('image/')
        ? 'image'
        : file.mimetype.startsWith('video/')
        ? 'video'
        : 'raw',
      folder: safeFolder,
    };
  }

  private async record(data: {
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    cloudinaryPublicId: string;
    resourceType: string;
    folder?: string;
    uploadedBy?: string;
  }) {
    try {
      return await this.prisma.mediaFile.create({
        data: {
          ...data,
          folder: data.folder || 'uploads',
          uploadedBy: data.uploadedBy,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Stored file but could not record it in the database: ${
          error instanceof Error ? error.message : error
        }`,
      );
      return { id: data.cloudinaryPublicId, ...data };
    }
  }

  private present(media: any) {
    return {
      id: media.id,
      url: media.url,
      originalName: media.originalName,
      mimeType: media.mimeType,
      size: media.size,
      resourceType: media.resourceType,
      folder: media.folder,
    };
  }
}
