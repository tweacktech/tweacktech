import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  async mine(@CurrentUser() user: any, @Query() query: any) {
    return this.notifications.mine(user.sub, {
      page: query.page ? parseInt(query.page, 10) : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
      unreadOnly: query.unreadOnly === 'true',
    });
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser() user: any) {
    return this.notifications.unreadCount(user.sub);
  }

  @Patch('read-all')
  async markAllRead(@CurrentUser() user: any) {
    return this.notifications.markAllRead(user.sub);
  }

  @Patch(':id/read')
  async markRead(@CurrentUser() user: any, @Param('id') id: string) {
    return this.notifications.markRead(user.sub, id);
  }
}
