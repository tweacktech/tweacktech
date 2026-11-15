import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { TicketStatus, TicketPriority, Role } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { RealtimeService } from '../realtime/realtime.service';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(
    private prisma: PrismaService,
    private readonly realtime: RealtimeService,
  ) {}

  async createTicket(data: any, userId: string) {
    const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}`;

    const ticket = await this.prisma.supportTicket.create({
      data: {
        ticketNumber,
        subject: data.subject,
        description: data.description,
        priority: data.priority || TicketPriority.MEDIUM,
        category: data.category,
        userId,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
    await this.realtime.trigger('private-admin', 'support:new', ticket);
    await this.realtime.trigger(`private-user-${userId}`, 'support:updated', {
      ticketId: ticket.id,
      status: ticket.status,
    });
    return ticket;
  }

  async findMyTickets(userId: string, params: { page?: number; limit?: number }) {
    const page = params.page || 1;
    const limit = Math.min(params.limit || 10, 100);
    const skip = (page - 1) * limit;

    const [tickets, total] = await this.prisma.$transaction([
      this.prisma.supportTicket.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          replies: {
            orderBy: { createdAt: 'asc' },
            select: {
              id: true,
              message: true,
              isInternal: true,
              createdAt: true,
              user: { select: { id: true, firstName: true, lastName: true, role: true } },
            },
          },
          _count: { select: { replies: true } },
        },
      }),
      this.prisma.supportTicket.count({ where: { userId } }),
    ]);

    return {
      tickets,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    status?: TicketStatus;
    priority?: TicketPriority;
    assignedTo?: string;
  }) {
    const page = params.page || 1;
    const limit = Math.min(params.limit || 10, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.priority) where.priority = params.priority;
    if (params.assignedTo) where.assignedTo = params.assignedTo;

    const [tickets, total] = await this.prisma.$transaction([
      this.prisma.supportTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          assignee: { select: { id: true, firstName: true, lastName: true } },
          replies: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { id: true, message: true, createdAt: true, isInternal: true },
          },
        },
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return {
      tickets,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, userId: string, userRole: Role, permissions: string[] = []) {
    const canManage =
      userRole === Role.SUPERADMIN ||
      userRole === Role.ADMIN ||
      permissions.includes('MANAGE_SUPPORT');

    const where: any = { id };
    if (!canManage) {
      where.userId = userId;
    }

    const ticket = await this.prisma.supportTicket.findUnique({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        assignee: { select: { id: true, firstName: true, lastName: true } },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, role: true } },
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }

  async addReply(
    ticketId: string,
    data: { message: string; isInternal?: boolean },
    userId: string,
    userRole: Role,
    permissions: string[] = [],
  ) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Check access - students can only reply to their own tickets
    if (
      userRole === Role.STUDENT &&
      ticket.userId !== userId
    ) {
      throw new BadRequestException('Access denied');
    }

    // Staff/Admin can add internal notes
    const canManage =
      userRole === Role.SUPERADMIN ||
      userRole === Role.ADMIN ||
      permissions.includes('MANAGE_SUPPORT');
    const isInternal = data.isInternal && canManage;

    const reply = await this.prisma.supportTicketReply.create({
      data: {
        ticketId,
        userId,
        message: data.message,
        isInternal,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });

    // Update ticket status
    await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: TicketStatus.IN_PROGRESS,
        updatedAt: new Date(),
      },
    });

    await this.realtime.trigger(`private-user-${ticket.userId}`, 'support:reply', reply);
    await this.realtime.trigger('private-admin', 'support:reply', {
      ticketId,
      reply,
    });
    return reply;
  }

  async updateTicket(
    id: string,
    data: { status?: TicketStatus; priority?: TicketPriority; assignedTo?: string },
    userId: string,
    userRole: Role,
  ) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const updated = await this.prisma.supportTicket.update({
      where: { id },
      data: {
        status: data.status,
        priority: data.priority,
        assignedTo: data.assignedTo,
        resolvedAt: data.status === TicketStatus.RESOLVED ? new Date() : null,
        updatedAt: new Date(),
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignee: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    await this.realtime.trigger(`private-user-${ticket.userId}`, 'support:updated', {
      ticketId: id,
      status: updated.status,
      priority: updated.priority,
    });
    await this.realtime.trigger('private-admin', 'support:updated', updated);
    return updated;
  }

  async getStats() {
    const total = await this.prisma.supportTicket.count();
    const open = await this.prisma.supportTicket.count({ where: { status: TicketStatus.OPEN } });
    const inProgress = await this.prisma.supportTicket.count({ where: { status: TicketStatus.IN_PROGRESS } });
    const resolved = await this.prisma.supportTicket.count({ where: { status: TicketStatus.RESOLVED } });
    const closed = await this.prisma.supportTicket.count({ where: { status: TicketStatus.CLOSED } });

    return { total, open, inProgress, resolved, closed };
  }
}
