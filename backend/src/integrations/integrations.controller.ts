import {
  Body,
  Controller,
  Headers,
  Post,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { IntegrationsService } from './integrations.service';

/** Key-based endpoint for n8n workflows (no user session/JWT involved). */
@Controller('integrations/n8n')
export class IntegrationsController {
  constructor(private readonly integrations: IntegrationsService) {}

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('blog')
  async createBlog(@Headers('x-api-key') apiKey: string, @Body() body: any) {
    const expected = process.env.N8N_API_KEY;
    if (!expected) {
      throw new ServiceUnavailableException('N8N_API_KEY is not configured');
    }
    if (!apiKey || apiKey !== expected) {
      throw new UnauthorizedException('Invalid integration API key');
    }
    return this.integrations.createBlog(body);
  }
}
