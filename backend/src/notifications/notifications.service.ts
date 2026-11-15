import { Injectable, Logger } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';

export interface CreateNotificationInput {
  userId: string;
  type?: NotificationType;
  title: string;
  body?: string;
  link?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
  ) {}

  async create(input: CreateNotificationInput) {
    try {
      const notification = await this.prisma.notification.create({
        data: {
          userId: input.userId,
          type: input.type || NotificationType.SYSTEM,
          title: input.title,
          body: input.body,
          link: input.link,
        },
      });
      await this.realtime.trigger(
        `private-user-${input.userId}`,
        'notification:new',
        notification,
      );
      return notification;
    } catch (error) {
      this.logger.warn(
        `Could not create notification: ${
          error instanceof Error ? error.message : error
        }`,
      );
      return null;
    }
  }

  async createMany(inputs: CreateNotificationInput[]) {
    if (!inputs.length) return { count: 0 };
    try {
      const data = inputs.map((input) => ({
        userId: input.userId,
        type: input.type || NotificationType.SYSTEM,
        title: input.title,
        body: input.body,
        link: input.link,
      }));
      const created = await this.prisma.notification.createManyAndReturn({ data });
      await Promise.all(
        created.map((notification) =>
          this.realtime.trigger(
            `private-user-${notification.userId}`,
            'notification:new',
            notification,
          ),
        ),
      );
      return { count: created.length };
    } catch (error) {
      this.logger.warn(
        `Could not create notifications: ${
          error instanceof Error ? error.message : error
        }`,
      );
      return { count: 0 };
    }
  }

  async mine(userId: string, params: { page?: number; limit?: number; unreadOnly?: boolean } = {}) {
    const page = params.page || 1;
    const limit = Math.min(params.limit || 25, 100);
    const where: any = { userId };
    if (params.unreadOnly) where.readAt = null;

    const [notifications, total, unread] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);

    return {
      notifications,
      unread,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  async unreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, readAt: null },
    });
    return { count };
  }

  async markRead(userId: string, id: string) {
    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { readAt: new Date() },
    });
    return { read: true };
  }

  async markAllRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { updated: result.count };
  }
}
