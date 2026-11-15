import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Post,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RealtimeService } from './realtime.service';

@Controller('pusher')
export class RealtimeController {
  constructor(
    private readonly realtime: RealtimeService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('auth')
  async authorize(
    @Body() body: { socket_id?: string; channel_name?: string },
    @CurrentUser() user: any,
  ) {
    const socketId = body?.socket_id;
    const channel = body?.channel_name;
    if (!socketId || !channel) {
      throw new BadRequestException('socket_id and channel_name are required');
    }

    const allowed = await this.canSubscribe(channel, user);
    if (!allowed) {
      throw new ForbiddenException('You cannot subscribe to this channel');
    }

    return this.realtime.authorize(socketId, channel);
  }

  private async canSubscribe(channel: string, user: any): Promise<boolean> {
    const isAdmin =
      user.role === Role.SUPERADMIN ||
      user.role === Role.ADMIN ||
      (user.permissions || []).includes('MANAGE_CHAT') ||
      (user.permissions || []).includes('MANAGE_SUPPORT');

    if (channel === 'private-admin') {
      return (
        user.role === Role.SUPERADMIN ||
        user.role === Role.ADMIN ||
        (user.permissions || []).some((permission: string) =>
          [
            'MANAGE_PAYMENTS',
            'MANAGE_SUPPORT',
            'MANAGE_JOBS',
            'MANAGE_TALENT',
            'MANAGE_USERS',
            'MANAGE_SETTINGS',
            'MANAGE_COURSES',
            'MANAGE_BLOG',
            'GRADE_ASSIGNMENTS',
          ].includes(permission),
        )
      );
    }

    if (channel === `private-user-${user.sub}`) return true;

    if (channel.startsWith('private-chat-')) {
      const roomId = channel.replace('private-chat-', '');
      const room = await this.prisma.chatRoom.findUnique({
        where: { id: roomId },
        select: {
          id: true,
          type: true,
          courseId: true,
          members: { where: { userId: user.sub }, select: { id: true } },
          course: {
            select: {
              instructorId: true,
              instructors: { where: { userId: user.sub }, select: { id: true } },
            },
          },
        },
      });
      if (!room) return false;
      if (room.members.length > 0) return true;
      if (
        room.course &&
        (room.course.instructorId === user.sub ||
          room.course.instructors.length > 0)
      ) {
        return true;
      }
      if (room.type === 'SUPPORT' && isAdmin) return true;
      return false;
    }

    return false;
  }
}
