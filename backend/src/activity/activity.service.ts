import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';

interface LogInput {
  actor?: { sub?: string; id?: string; firstName?: string; lastName?: string; role?: string } | null;
  action: string;
  description?: string;
  method?: string;
  path?: string;
  entityType?: string;
  entityId?: string;
  statusCode?: number;
  ip?: string;
  metadata?: Record<string, unknown>;
}

const SENSITIVE_KEYS = /pass(word)?|token|secret|otp|code|receipt|file|base64/i;

const cleanValue = (value: any, depth = 0): any => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string') {
    return value.length > 280 ? `${value.slice(0, 277)}…` : value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) {
    if (depth > 1) return `[${value.length} items]`;
    return value.slice(0, 12).map((item) => cleanValue(item, depth + 1));
  }
  if (typeof value === 'object') {
    if (depth > 1) return '[object]';
    const output: Record<string, any> = {};
    Object.entries(value)
      .slice(0, 20)
      .forEach(([key, item]) => {
        if (SENSITIVE_KEYS.test(key)) return;
        output[key] = cleanValue(item, depth + 1);
      });
    return output;
  }
  return undefined;
};

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Fire-and-forget write; monitoring must never break a request. */
  log(input: LogInput) {
    const actor = input.actor || {};
    const actorId = actor.sub || actor.id || null;
    const actorName =
      [actor.firstName, actor.lastName].filter(Boolean).join(' ') || null;

    this.prisma.activityLog
      .create({
        data: {
          actorId: actorId || null,
          actorName,
          actorRole: actor.role || null,
          action: input.action.slice(0, 120),
          description: input.description?.slice(0, 500) || null,
          method: input.method || null,
          path: input.path?.slice(0, 300) || null,
          entityType: input.entityType?.slice(0, 60) || null,
          entityId: input.entityId || null,
          statusCode: input.statusCode || null,
          ip: input.ip?.slice(0, 80) || null,
          metadata: input.metadata ? cleanValue(input.metadata) : undefined,
        },
      })
      .catch((error) => {
        this.logger.warn(`Could not record activity: ${error?.message || error}`);
      });
  }

  async clear() {
    return this.prisma.activityLog.deleteMany({});
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    action?: string;
    entityType?: string;
    actorId?: string;
    from?: string;
    to?: string;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 25));
    const where: any = {};

    if (query.action) where.action = { startsWith: query.action };
    if (query.entityType) where.entityType = query.entityType;
    if (query.actorId) where.actorId = query.actorId;

    if (query.search) {
      where.OR = [
        { action: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { actorName: { contains: query.search, mode: 'insensitive' } },
        { path: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) {
        const to = new Date(query.to);
        to.setHours(23, 59, 59, 999);
        where.createdAt.lte = to;
      }
    }

    const [logs, total, actions, entities] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          actor: {
            select: { id: true, firstName: true, lastName: true, avatar: true, role: true },
          },
        },
      }),
      this.prisma.activityLog.count({ where }),
      this.prisma.activityLog.findMany({
        distinct: ['action'],
        select: { action: true },
        orderBy: { action: 'asc' },
        take: 120,
      }),
      this.prisma.activityLog.findMany({
        distinct: ['entityType'],
        select: { entityType: true },
        orderBy: { entityType: 'asc' },
        take: 60,
      }),
    ]);

    return {
      logs,
      actions: actions.map((row) => row.action).filter(Boolean),
      entities: entities.map((row) => row.entityType).filter(Boolean),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }
}
