import {
  ValidationPipe,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { mkdirSync } from 'fs';
import express from 'express';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';

const logger = new Logger('Bootstrap');

// compression is a small optimisation, never a hard deployment requirement.
// (Older serverless bundles sometimes ship without it — skip gzip if absent.)
let compression: (options?: any) => any = () => (_req: any, _res: any, next: any) => next();
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  compression = require('compression');
} catch {
  logger.warn('compression is not installed — continuing without response compression');
}

/**
 * Shared application setup used by both the long-running server (`main.ts`)
 * and the Vercel serverless entry point (`api/index.ts`).
 */
export async function configureApp(app: NestExpressApplication) {
  const configService = app.get(ConfigService);
  const isServerless = Boolean(process.env.VERCEL);

  // Body parsers with an explicit limit. Nest's default is 100 KB, which is
  // too small for n8n workflow posts that carry long article bodies or
  // inline images. Keep the raw buffer so Paystack webhook signatures work.
  const verifyRaw = (req: any, _res: any, buffer: Buffer) => {
    req.rawBody = buffer;
  };
  app.use(express.json({ limit: '20mb', verify: verifyRaw }));
  app.use(express.urlencoded({ extended: true, limit: '20mb', verify: verifyRaw }));

  // Compress JSON and static assets (threshold keeps tiny responses as-is).
  app.use(compression({ threshold: 1024 }));

  // Security headers for API responses. The frontend sets its own, richer
  // policy in vercel.json; these cover JSON, uploads and local development.
  app.use((req: any, res: any, next: any) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()',
    );
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    // Uploads are embedded by the frontend, which lives on another origin.
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    if (configService.get('NODE_ENV') === 'production') {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=63072000; includeSubDomains; preload',
      );
    }
    // A JSON API never needs to render content. Skip Swagger, which does.
    const path = String(req.path || '');
    if (path.startsWith('/api') && !path.startsWith('/api/docs')) {
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
      );
    }
    next();
  });

  app.setGlobalPrefix('api');

  // Behind Vercel/most reverse proxies the client IP and protocol live in the
  // forwarded headers. Needed for rate-limiting/logging correctness.
  try {
    app.set('trust proxy', 1);
  } catch {
    // ignore — not every adapter exposes Express settings
  }

  if (!isServerless) {
    // Local uploads (payment proofs fallback, media when Cloudinary is not
    // configured). Serverless filesystems are read-only, so this is skipped on
    // Vercel — Cloudinary is the production media store.
    const uploadsDir = join(process.cwd(), 'uploads');
    try {
      mkdirSync(uploadsDir, { recursive: true });
    } catch {
      // ignore — directory may already exist
    }
    app.useStaticAssets(uploadsDir, { prefix: '/uploads/' });
  }

  // CORS — comma-separated allow-list, plus Vercel preview/production domains.
  const configuredOrigins = (configService.get('CORS_ORIGIN') || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const frontendUrl = (configService.get('FRONTEND_URL') || '').trim();
  if (frontendUrl) configuredOrigins.push(frontendUrl.replace(/\/$/, ''));

  const isProduction = configService.get('NODE_ENV') === 'production';
  const allowOrigin = (origin?: string) => {
    if (!origin) return true; // same-origin, curl, server-to-server
    if (configuredOrigins.includes(origin)) return true;
    // Local development/preview servers only. Accepting arbitrary localhost
    // or *.vercel.app origins in production lets any attacker site make
    // credentialed requests to the API.
    if (!isProduction && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/i.test(origin)) {
      return true;
    }
    return false;
  };

  app.enableCors({
    origin: (origin, callback) => callback(null, allowOrigin(origin)),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    maxAge: 86400,
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const formattedErrors = errors.map((error) => ({
          field: error.property,
          errors: Object.values(error.constraints || {}),
        }));
        throw new BadRequestException({
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          errors: formattedErrors,
        });
      },
    }),
  );

  // Global filters and interceptors
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new TransformInterceptor(),
    new TimeoutInterceptor(),
  );

  // Swagger is useful locally and in staging, but it is extra cold-start work
  // on serverless. Set ENABLE_SWAGGER=true to expose it on Vercel.
  const swaggerEnabled =
    !isServerless || configService.get('ENABLE_SWAGGER') === 'true';
  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('TweackTech LMS API')
      .setDescription('Professional LMS & Talent Hub API - Nest.js + PostgreSQL')
      .setVersion('1.0.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication & Authorization')
      .addTag('users', 'User Management')
      .addTag('courses', 'Course Management')
      .addTag('enrollments', 'Student Enrollments')
      .addTag('lessons', 'Lessons & Content')
      .addTag('payments', 'Payments & Monetization')
      .addTag('certificates', 'Certificates')
      .addTag('blog', 'Blog & News')
      .addTag('support', 'Support System')
      .addTag('media', 'Media & Cloudinary')
      .addTag('chat', 'Course, direct and support chat')
      .addTag('chatbot', 'Support assistant')
      .addTag('talent', 'Talent Hub profiles')
      .addTag('admin', 'Admin Panel')
      .addTag('staff', 'Staff Panel')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  logger.log(`Configured ${isServerless ? 'serverless' : 'standalone'} NestJS app`);
  return app;
}