import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Database connected (Neon PostgreSQL)');
    } catch (error) {
      // Keep the API process alive. Health checks and requests will return a
      // friendly 503 until the database is reachable again.
      this.logger.warn(
        `⚠️  Database is unavailable at startup: ${
          error instanceof Error ? error.message.split('\n')[0] : error
        }`,
      );
      this.logger.warn(
        'The API is running in degraded/offline mode. It will reconnect automatically.',
      );
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('🔌 Database disconnected');
    } catch {
      // ignore shutdown errors
    }
  }
}
