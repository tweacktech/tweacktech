import { Controller, Get, Logger } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async check() {
    const startedAt = Date.now();
    let database: 'up' | 'down' = 'up';
    let databaseError: string | undefined;

    try {
      await this.withTimeout(this.prisma.$queryRaw`SELECT 1`, 3500);
    } catch (error) {
      database = 'down';
      databaseError = error instanceof Error ? error.message : 'unknown';
      this.logger.warn(`Health check: database unreachable (${databaseError})`);
    }

    return {
      status: database === 'up' ? 'ok' : 'degraded',
      service: 'tweacktech-api',
      database,
      databaseError:
        process.env.NODE_ENV === 'production' ? undefined : databaseError,
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
    };
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Health check timed out')), ms),
      ),
    ]);
  }
}
