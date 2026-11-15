import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('rooms')
  async rooms(@CurrentUser() user: any) {
    return this.chatService.getRooms(user);
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser() user: any) {
    return this.chatService.unreadCount(user.sub);
  }

  @Get('contacts')
  async contacts(@CurrentUser() user: any) {
    return this.chatService.contacts(user);
  }

  @Post('direct/:userId')
  async createDirect(@Param('userId') userId: string, @CurrentUser() user: any) {
    return this.chatService.createDirect(user, userId);
  }

  @Post('groups')
  async createGroup(@Body() body: any, @CurrentUser() user: any) {
    return this.chatService.createGroup(user, body);
  }

  @Post('support')
  async createSupport(@CurrentUser() user: any) {
    return this.chatService.createSupportRoom(user);
  }

  @Get('rooms/:id')
  async room(@Param('id') id: string, @CurrentUser() user: any) {
    return this.chatService.getRoom(id, user);
  }

  @Get('rooms/:id/messages')
  async messages(
    @Param('id') id: string,
    @Query() query: any,
    @CurrentUser() user: any,
  ) {
    return this.chatService.getMessages(id, user, {
      before: query.before,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
    });
  }

  @Post('rooms/:id/messages')
  async send(
    @Param('id') id: string,
    @Body() body: { body: string; attachmentUrl?: string },
    @CurrentUser() user: any,
  ) {
    return this.chatService.sendMessage(id, user, body);
  }

  @Post('rooms/:id/read')
  async markRead(@Param('id') id: string, @CurrentUser() user: any) {
    return this.chatService.markRead(id, user);
  }

  @Post('rooms/:id/members')
  async addMembers(
    @Param('id') id: string,
    @Body() body: { userIds: string[] },
    @CurrentUser() user: any,
  ) {
    return this.chatService.addMembers(id, body.userIds || [], user);
  }
}
