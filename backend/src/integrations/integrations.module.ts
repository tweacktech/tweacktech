import { Module } from '@nestjs/common';
import { BlogModule } from '../blog/blog.module';
import { MediaModule } from '../media/media.module';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';

@Module({
  imports: [BlogModule, MediaModule],
  controllers: [IntegrationsController],
  providers: [IntegrationsService],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
