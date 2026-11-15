import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Pusher from 'pusher';

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);
  private readonly client: Pusher | null;

  constructor(private readonly config: ConfigService) {
    const appId = this.config.get<string>('PUSHER_APP_ID');
    const key = this.config.get<string>('PUSHER_KEY');
    const secret = this.config.get<string>('PUSHER_SECRET');
    const cluster = this.config.get<string>('PUSHER_CLUSTER');

    if (appId && key && secret && cluster) {
      this.client = new Pusher({
        appId,
        key,
        secret,
        cluster,
        useTLS: true,
      });
    } else {
      this.client = null;
      this.logger.warn(
        'Pusher is not configured — realtime events will be skipped (polling fallback still works).',
      );
    }
  }

  get enabled() {
    return Boolean(this.client);
  }

  async trigger(channel: string, event: string, data: any): Promise<void> {
    if (!this.client) return;
    // Deliberately fire-and-forget: the HTTP request must not wait on Pusher.
    void this.client
      .trigger(channel, event, data)
      .catch((error) =>
        this.logger.warn(
          `Pusher trigger failed for ${channel}/${event}: ${
            error instanceof Error ? error.message : error
          }`,
        ),
      );
  }

  authorize(socketId: string, channel: string) {
    if (!this.client) {
      throw new ServiceUnavailableException({
        message: 'Realtime is not configured.',
        code: 'PUSHER_NOT_CONFIGURED',
      });
    }
    return this.client.authorizeChannel(socketId, channel);
  }
}
