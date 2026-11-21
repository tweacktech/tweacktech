import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  ChatMemberRole,
  ChatRoomType,
  EnrollmentStatus,
  Prisma,
  Role,
} from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeService } from '../realtime/realtime.service';

const SENDER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  avatar: true,
  role: true,
};

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly realtime: RealtimeService,
  ) {}

  // -------------------------------------------------------------------------
  // Room discovery
  // -------------------------------------------------------------------------

  async getRooms(user: any) {
    await this.ensureCourseRooms(user);

    const isSupportStaff =
      user.role === Role.SUPERADMIN ||
      user.role === Role.ADMIN ||
      (user.permissions || []).includes('MANAGE_SUPPORT');

    const where: any = isSupportStaff
      ? {
          OR: [
            { members: { some: { userId: user.sub } } },
            { type: ChatRoomType.SUPPORT },
          ],
        }
      : { members: { some: { userId: user.sub } } };

    const rooms = await this.prisma.chatRoom.findMany({
      where: { isArchived: false, ...where },
      orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        course: { select: { id: true, title: true, thumbnail: true } },
        members: {
          include: { user: { select: SENDER_SELECT } },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { sender: { select: SENDER_SELECT } },
        },
        _count: { select: { messages: true, members: true } },
      },
    });

    // One aggregate query for unread counts instead of a query per room.
    const unreadByRoom = new Map<string, number>();
    if (rooms.length > 0) {
      const roomIds = rooms.map((room) => room.id);
      const rows = await this.prisma.$queryRaw<Array<{ roomId: string; unread: number }>>`
        SELECT m."roomId" AS "roomId", COUNT(*)::int AS unread
        FROM "ChatMessage" m
        JOIN "ChatRoomMember" mem
          ON mem."roomId" = m."roomId" AND mem."userId" = ${user.sub}
        WHERE m."roomId" IN (${Prisma.join(roomIds)})
          AND m."senderId" <> ${user.sub}
          AND (mem."lastReadAt" IS NULL OR m."createdAt" > mem."lastReadAt")
        GROUP BY m."roomId"
      `;
      rows.forEach((row) => unreadByRoom.set(row.roomId, Number(row.unread)));
    }

    const withUnread = rooms.map((room) => {
      const membership = room.members.find((member) => member.userId === user.sub);
      return {
        id: room.id,
        name: room.name || this.defaultRoomName(room),
        type: room.type,
        course: room.course,
        isMember: Boolean(membership),
        role: membership?.role || (isSupportStaff ? 'MODERATOR' : null),
        unread: unreadByRoom.get(room.id) || 0,
        memberCount: room._count.members,
        messageCount: room._count.messages,
        members: room.members.map((member) => member.user),
        lastMessage: room.messages[0] || null,
        lastMessageAt: room.lastMessageAt || room.createdAt,
        createdAt: room.createdAt,
      };
    });

    // A completed course no longer has a student forum. Instructors and
    // support staff keep their access so they can still help other learners.
    const completed = await this.prisma.enrollment.findMany({
      where: { userId: user.sub, status: EnrollmentStatus.COMPLETED },
      select: { courseId: true },
    });
    const completedIds = new Set(completed.map((row) => row.courseId));
    const visible = withUnread.filter((room) => {
      if (isSupportStaff || room.type !== ChatRoomType.COURSE || !room.course) return true;
      return !completedIds.has(room.course.id);
    });

    return visible.sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
    );
  }

  async unreadCount(userId: string) {
    const rows = await this.prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*)::int AS count
      FROM "ChatMessage" m
      JOIN "ChatRoomMember" mem
        ON mem."roomId" = m."roomId" AND mem."userId" = ${userId}
      WHERE m."senderId" <> ${userId}
        AND (mem."lastReadAt" IS NULL OR m."createdAt" > mem."lastReadAt")
    `;
    return { count: Number(rows[0]?.count || 0) };
  }

  /** People a learner can message directly: their instructors plus support staff. */
  async contacts(user: any) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId: user.sub },
      select: { courseId: true },
    });
    const courseIds = enrollments.map((row) => row.courseId);

    const courses = courseIds.length
      ? await this.prisma.course.findMany({
          where: { id: { in: courseIds } },
          select: {
            instructor: {
              select: { id: true, firstName: true, lastName: true, avatar: true, role: true },
            },
            instructors: {
              select: {
                user: {
                  select: { id: true, firstName: true, lastName: true, avatar: true, role: true },
                },
              },
            },
          },
        })
      : [];

    const map = new Map<string, any>();
    for (const course of courses) {
      if (course.instructor) map.set(course.instructor.id, course.instructor);
      for (const row of course.instructors) map.set(row.user.id, row.user);
    }

    const staff = await this.prisma.user.findMany({
      where: {
        isActive: true,
        role: { in: [Role.STAFF, Role.ADMIN, Role.SUPERADMIN] },
      },
      select: { id: true, firstName: true, lastName: true, avatar: true, role: true },
      take: 20,
      orderBy: { firstName: 'asc' },
    });
    for (const person of staff) map.set(person.id, person);
    map.delete(user.sub);

    return Array.from(map.values());
  }

  async getRoom(roomId: string, user: any) {
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        course: { select: { id: true, title: true, thumbnail: true } },
        members: {
          include: { user: { select: SENDER_SELECT } },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });
    if (!room) throw new NotFoundException('Chat room not found');
    await this.assertAccess(room, user);

    return {
      ...room,
      name: room.name || this.defaultRoomName(room),
      members: room.members.map((member) => ({
        ...member.user,
        memberRole: member.role,
        joinedAt: member.joinedAt,
        lastReadAt: member.lastReadAt,
      })),
    };
  }

  async getMessages(roomId: string, user: any, params: { before?: string; limit?: number }) {
    const room = await this.prisma.chatRoom.findUnique({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Chat room not found');
    await this.assertAccess(room, user);

    const limit = Math.min(Number(params.limit) || 40, 100);
    const before = params.before ? new Date(params.before) : null;

    const messages = await this.prisma.chatMessage.findMany({
      where: {
        roomId,
        ...(before && !Number.isNaN(before.getTime())
          ? { createdAt: { lt: before } }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { sender: { select: SENDER_SELECT } },
    });

    return messages.reverse();
  }

  async sendMessage(roomId: string, user: any, data: { body: string; attachmentUrl?: string }) {
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: { members: { select: { userId: true } }, course: { select: { title: true } } },
    });
    if (!room) throw new NotFoundException('Chat room not found');
    await this.assertAccess(room, user);

    const body = String(data.body || '').trim();
    if (!body && !data.attachmentUrl) {
      throw new BadRequestException('Write a message before sending');
    }
    if (body.length > 4000) {
      throw new BadRequestException('Messages cannot exceed 4000 characters');
    }

    const message = await this.prisma.chatMessage.create({
      data: {
        roomId,
        senderId: user.sub,
        body: body || '📎 Attachment',
        attachmentUrl: data.attachmentUrl,
      },
      include: { sender: { select: SENDER_SELECT } },
    });

    await this.prisma.chatRoom.update({
      where: { id: roomId },
      data: { lastMessageAt: new Date() },
    });

    // Keep member state consistent even for support staff who joined implicitly.
    await this.prisma.chatRoomMember.upsert({
      where: { roomId_userId: { roomId, userId: user.sub } },
      update: { lastReadAt: new Date() },
      create: {
        roomId,
        userId: user.sub,
        role:
          room.type === ChatRoomType.SUPPORT && user.role !== Role.STUDENT
            ? ChatMemberRole.MODERATOR
            : ChatMemberRole.MEMBER,
        lastReadAt: new Date(),
      },
    });

    if (room.type === ChatRoomType.DIRECT || room.type === ChatRoomType.SUPPORT) {
      await this.notifications.createMany(
        room.members
          .filter((member) => member.userId !== user.sub)
          .map((member) => ({
            userId: member.userId,
            type: 'CHAT' as const,
            title: `New message from ${user.firstName || 'TweackTech'}`,
            body: body.slice(0, 140),
            link: `/messages?room=${roomId}`,
          })),
      );
    }

    await this.realtime.trigger(`private-chat-${roomId}`, 'chat:message', message);
    await Promise.all(
      room.members
        .filter((member) => member.userId !== user.sub)
        .map((member) =>
          this.realtime.trigger(`private-user-${member.userId}`, 'chat:activity', {
            roomId,
            message,
          }),
        ),
    );
    if (room.type === ChatRoomType.SUPPORT) {
      await this.realtime.trigger('private-admin', 'support:message', {
        roomId,
        message,
      });
    }

    return message;
  }

  async markRead(roomId: string, user: any) {
    const room = await this.prisma.chatRoom.findUnique({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Chat room not found');
    await this.assertAccess(room, user);

    await this.prisma.chatRoomMember.upsert({
      where: { roomId_userId: { roomId, userId: user.sub } },
      update: { lastReadAt: new Date() },
      create: {
        roomId,
        userId: user.sub,
        role:
          room.type === ChatRoomType.SUPPORT && user.role !== Role.STUDENT
            ? ChatMemberRole.MODERATOR
            : ChatMemberRole.MEMBER,
        lastReadAt: new Date(),
      },
    });
    return { read: true };
  }

  // -------------------------------------------------------------------------
  // Room creation
  // -------------------------------------------------------------------------

  async createDirect(actor: any, targetId: string) {
    if (targetId === actor.sub) {
      throw new BadRequestException('You cannot start a chat with yourself');
    }
    const target = await this.prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, firstName: true, lastName: true, role: true, isActive: true },
    });
    if (!target || !target.isActive) throw new NotFoundException('User not found');

    const candidates = await this.prisma.chatRoom.findMany({
      where: {
        type: ChatRoomType.DIRECT,
        AND: [
          { members: { some: { userId: actor.sub } } },
          { members: { some: { userId: targetId } } },
        ],
      },
      include: { members: { select: { userId: true } } },
    });
    const existing = candidates.find(
      (room) =>
        room.members.length === 2 &&
        room.members.some((member) => member.userId === actor.sub) &&
        room.members.some((member) => member.userId === targetId),
    );
    if (existing) return this.getRoom(existing.id, actor);

    const room = await this.prisma.chatRoom.create({
      data: {
        type: ChatRoomType.DIRECT,
        createdById: actor.sub,
        members: {
          create: [
            { userId: actor.sub, role: ChatMemberRole.OWNER },
            { userId: targetId, role: ChatMemberRole.MEMBER },
          ],
        },
      },
    });
    const detail = await this.getRoom(room.id, actor);
    await Promise.all([
      this.realtime.trigger(`private-user-${actor.sub}`, 'chat:room', detail),
      this.realtime.trigger(`private-user-${targetId}`, 'chat:room', detail),
    ]);
    return detail;
  }

  async createGroup(
    actor: any,
    data: { name: string; memberIds?: string[]; courseId?: string },
  ) {
    const name = String(data.name || '').trim();
    if (!name) throw new BadRequestException('Give the group a name');

    const memberIds = Array.from(
      new Set((data.memberIds || []).filter(Boolean).filter((id) => id !== actor.sub)),
    );

    const room = await this.prisma.chatRoom.create({
      data: {
        name,
        type: ChatRoomType.GROUP,
        createdById: actor.sub,
        courseId: data.courseId || null,
        members: {
          create: [
            { userId: actor.sub, role: ChatMemberRole.OWNER },
            ...memberIds.map((userId) => ({ userId, role: ChatMemberRole.MEMBER })),
          ],
        },
      },
    });
    const detail = await this.getRoom(room.id, actor);
    await Promise.all(
      [actor.sub, ...memberIds].map((userId) =>
        this.realtime.trigger(`private-user-${userId}`, 'chat:room', detail),
      ),
    );
    return detail;
  }

  async createSupportRoom(actor: any) {
    const existing = await this.prisma.chatRoom.findFirst({
      where: {
        type: ChatRoomType.SUPPORT,
        createdById: actor.sub,
      },
      include: { members: { select: { userId: true } } },
    });
    if (existing) return this.getRoom(existing.id, actor);

    const room = await this.prisma.chatRoom.create({
      data: {
        name: 'TweackTech Support',
        type: ChatRoomType.SUPPORT,
        createdById: actor.sub,
        members: {
          create: [{ userId: actor.sub, role: ChatMemberRole.OWNER }],
        },
      },
    });
    const detail = await this.getRoom(room.id, actor);
    await Promise.all([
      this.realtime.trigger(`private-user-${actor.sub}`, 'chat:room', detail),
      this.realtime.trigger('private-admin', 'support:new-room', {
        roomId: room.id,
        userId: actor.sub,
      }),
    ]);
    return detail;
  }

  async addMembers(roomId: string, memberIds: string[], actor: any) {
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: { members: true },
    });
    if (!room) throw new NotFoundException('Chat room not found');

    const membership = room.members.find((member) => member.userId === actor.sub);
    const canAdd =
      actor.role === Role.SUPERADMIN ||
      actor.role === Role.ADMIN ||
      (membership && membership.role !== ChatMemberRole.MEMBER);
    if (!canAdd) {
      throw new ForbiddenException('Only room owners, moderators or admins can add members');
    }

    const ids = Array.from(new Set((memberIds || []).filter(Boolean)));
    await this.prisma.chatRoomMember.createMany({
      data: ids.map((userId) => ({ roomId, userId })),
      skipDuplicates: true,
    });
    const detail = await this.getRoom(roomId, actor);
    await Promise.all(
      ids.map((userId) =>
        this.realtime.trigger(`private-user-${userId}`, 'chat:room', detail),
      ),
    );
    return detail;
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private async assertAccess(
    room: { id: string; type: ChatRoomType; courseId: string | null },
    user: any,
  ) {
    const membership = await this.prisma.chatRoomMember.findUnique({
      where: { roomId_userId: { roomId: room.id, userId: user.sub } },
    });

    const supportStaff =
      user.role === Role.SUPERADMIN ||
      user.role === Role.ADMIN ||
      (user.permissions || []).includes('MANAGE_SUPPORT');

    if (membership) {
      if (room.type === ChatRoomType.COURSE && room.courseId && !supportStaff) {
        const enrollment = await this.prisma.enrollment.findUnique({
          where: {
            userId_courseId: { userId: user.sub, courseId: room.courseId },
          },
          select: { status: true },
        });
        if (enrollment?.status === EnrollmentStatus.COMPLETED) {
          throw new ForbiddenException('This course is complete, so its class forum is closed.');
        }
      }
      return membership;
    }

    if (room.type === ChatRoomType.SUPPORT && supportStaff) return null;

    if (room.type === ChatRoomType.COURSE && room.courseId) {
      const course = await this.prisma.course.findUnique({
        where: { id: room.courseId },
        select: {
          instructorId: true,
          instructors: { select: { userId: true } },
        },
      });
      if (
        course &&
        (course.instructorId === user.sub ||
          course.instructors.some((row) => row.userId === user.sub))
      ) {
        return null;
      }
    }

    throw new ForbiddenException('You are not a member of this chat');
  }

  private async ensureCourseRooms(user: any) {
    const [enrollments, instructed] = await Promise.all([
      this.prisma.enrollment.findMany({
        where: {
          userId: user.sub,
          status: { not: EnrollmentStatus.COMPLETED },
        },
        select: { courseId: true },
      }),
      this.prisma.course.findMany({
        where: {
          OR: [
            { instructorId: user.sub },
            { instructors: { some: { userId: user.sub } } },
          ],
        },
        select: { id: true },
      }),
    ]);

    const courseIds = Array.from(
      new Set([
        ...enrollments.map((row) => row.courseId),
        ...instructed.map((row) => row.id),
      ]),
    );
    await Promise.all(courseIds.map((courseId) => this.ensureCourseRoom(courseId, user)));
  }

  async ensureCourseRoom(courseId: string, user?: any) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        instructorId: true,
        instructors: { select: { userId: true } },
      },
    });
    if (!course) return null;

    const room = await this.prisma.chatRoom.upsert({
      where: { courseId_type: { courseId, type: ChatRoomType.COURSE } },
      update: {},
      create: {
        courseId,
        type: ChatRoomType.COURSE,
        name: `${course.title} · Class chat`,
        createdById: course.instructorId,
      },
    });

    const instructorIds = Array.from(
      new Set([course.instructorId, ...course.instructors.map((row) => row.userId)]),
    );
    for (const instructorId of instructorIds) {
      await this.prisma.chatRoomMember.upsert({
        where: { roomId_userId: { roomId: room.id, userId: instructorId } },
        update: { role: ChatMemberRole.MODERATOR },
        create: {
          roomId: room.id,
          userId: instructorId,
          role: ChatMemberRole.MODERATOR,
        },
      });
    }

    if (user?.sub) {
      const enrolled = await this.prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: user.sub, courseId } },
        select: { id: true, status: true },
      });
      if (enrolled && enrolled.status !== EnrollmentStatus.COMPLETED) {
        await this.prisma.chatRoomMember.upsert({
          where: { roomId_userId: { roomId: room.id, userId: user.sub } },
          update: {},
          create: { roomId: room.id, userId: user.sub },
        });
      }
    }

    return room;
  }

  private defaultRoomName(room: { type: ChatRoomType; name: string | null; course?: any; members?: any[] }) {
    if (room.name) return room.name;
    if (room.type === ChatRoomType.COURSE && room.course?.title) {
      return `${room.course.title} · Class chat`;
    }
    if (room.type === ChatRoomType.SUPPORT) return 'TweackTech Support';
    if (room.type === ChatRoomType.DIRECT && room.members?.length) {
      return room.members
        .filter((member) => member.user)
        .map((member) => `${member.user.firstName} ${member.user.lastName}`)
        .join(', ');
    }
    return 'Conversation';
  }
}
