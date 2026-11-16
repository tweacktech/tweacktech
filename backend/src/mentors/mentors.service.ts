import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { ActivityService } from '../activity/activity.service';

const MENTOR_ROLES: Role[] = [Role.STAFF, Role.ADMIN, Role.SUPERADMIN];

const PUBLIC_USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  avatar: true,
  role: true,
  bio: true,
  location: true,
  website: true,
  linkedin: true,
  twitter: true,
  hourlyRate: true,
  availability: true,
};

@Injectable()
export class MentorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
  ) {}

  private toArray(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.map((item) => String(item).trim()).filter(Boolean).slice(0, 30);
    }
    if (typeof value === 'string') {
      return value
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 30);
    }
    return [];
  }

  private async courseCounts(userIds: string[]) {
    if (!userIds.length) return new Map<string, number>();
    const rows = await this.prisma.course.groupBy({
      by: ['instructorId'],
      where: { instructorId: { in: userIds }, isPublished: true },
      _count: { _all: true },
    });
    return new Map(rows.map((row) => [row.instructorId, row._count._all]));
  }

  async list(query: {
    featured?: boolean;
    search?: string;
    skill?: string;
    limit?: number;
    publishedOnly?: boolean;
  }) {
    const and: any[] = [];
    if (query.publishedOnly !== false) and.push({ isPublished: true });
    if (query.featured === true) and.push({ isFeatured: true });
    if (query.search) {
      and.push({
        OR: [
          { headline: { contains: query.search, mode: 'insensitive' } },
          { bio: { contains: query.search, mode: 'insensitive' } },
          { skills: { has: query.search } },
          { user: { firstName: { contains: query.search, mode: 'insensitive' } } },
          { user: { lastName: { contains: query.search, mode: 'insensitive' } } },
        ],
      });
    }
    if (query.skill) and.push({ skills: { has: query.skill } });

    const profiles = await this.prisma.mentorProfile.findMany({
      where: {
        ...(and.length ? { AND: and } : {}),
        user: { isActive: true, role: { in: MENTOR_ROLES } },
      },
      include: { user: { select: PUBLIC_USER_SELECT } },
      orderBy: [{ isFeatured: 'desc' }, { updatedAt: 'desc' }],
      take: Math.min(60, Math.max(1, query.limit || 24)),
    });

    const counts = await this.courseCounts(profiles.map((profile) => profile.userId));
    return profiles.map((profile) => ({
      ...profile,
      courseCount: counts.get(profile.userId) || 0,
    }));
  }

  async featured(limit?: number) {
    return this.list({ featured: true, limit: limit || 6 });
  }

  async detail(id: string) {
    const profile = await this.prisma.mentorProfile.findFirst({
      where: {
        OR: [{ id }, { userId: id }],
      },
      include: {
        user: {
          select: {
            ...PUBLIC_USER_SELECT,
            courses: {
              where: { isPublished: true },
              select: {
                id: true,
                title: true,
                slug: true,
                thumbnail: true,
                shortDescription: true,
                type: true,
                price: true,
                currency: true,
                level: true,
                duration: true,
                totalLessons: true,
                _count: { select: { enrollments: true } },
              },
              orderBy: { createdAt: 'desc' },
              take: 12,
            },
          },
        },
      },
    });
    if (!profile) throw new NotFoundException('Mentor not found');
    return profile;
  }

  async mine(userId: string) {
    return this.prisma.mentorProfile.findUnique({
      where: { userId },
      include: { user: { select: PUBLIC_USER_SELECT } },
    });
  }

  async upsertMine(user: any, body: any, targetUserId?: string) {
    const userId = targetUserId || user.sub;
    const target = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, firstName: true, lastName: true },
    });
    if (!target) throw new NotFoundException('User not found');
    if (!MENTOR_ROLES.includes(target.role)) {
      throw new ForbiddenException('Only staff and admins can create a mentor profile');
    }
    if (targetUserId && targetUserId !== user.sub) {
      const canManage = user.role === Role.SUPERADMIN || user.role === Role.ADMIN;
      if (!canManage) {
        throw new ForbiddenException('Only admins can edit another mentor profile');
      }
    }

    const headline = String(body.headline || '').trim();
    if (!headline) throw new BadRequestException('A mentor headline is required');

    const data = {
      headline: headline.slice(0, 140),
      bio: body.bio ? String(body.bio).slice(0, 3000) : null,
      qualifications: this.toArray(body.qualifications),
      skills: this.toArray(body.skills),
      yearsExperience:
        body.yearsExperience === undefined || body.yearsExperience === ''
          ? null
          : Math.max(0, Math.min(60, parseInt(body.yearsExperience, 10) || 0)),
      linkedin: body.linkedin || null,
      twitter: body.twitter || null,
      website: body.website || null,
      bannerImage: body.bannerImage || null,
      isPublished:
        body.isPublished === undefined
          ? true
          : body.isPublished === true || body.isPublished === 'true',
      isFeatured:
        body.isFeatured === undefined
          ? false
          : body.isFeatured === true || body.isFeatured === 'true',
    };

    const profile = await this.prisma.mentorProfile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
      include: { user: { select: PUBLIC_USER_SELECT } },
    });

    this.activity.log({
      actor: user,
      action: 'mentors.updated',
      description: `${target.firstName} ${target.lastName} updated their mentor profile`,
      entityType: 'mentor profile',
      entityId: profile.id,
      metadata: { headline: profile.headline, isPublished: profile.isPublished },
    });

    return profile;
  }

  async adminList() {
    const profiles = await this.prisma.mentorProfile.findMany({
      include: { user: { select: PUBLIC_USER_SELECT } },
      orderBy: [{ isFeatured: 'desc' }, { updatedAt: 'desc' }],
    });
    const counts = await this.courseCounts(profiles.map((profile) => profile.userId));
    return profiles.map((profile) => ({
      ...profile,
      courseCount: counts.get(profile.userId) || 0,
    }));
  }

  async setFeatured(userId: string, isFeatured: boolean, actor: any) {
    const profile = await this.prisma.mentorProfile.findFirst({
      where: { OR: [{ id: userId }, { userId }] },
      select: { id: true, userId: true },
    });
    if (!profile) throw new NotFoundException('Mentor profile not found');
    const updated = await this.prisma.mentorProfile.update({
      where: { id: profile.id },
      data: { isFeatured: !!isFeatured },
    });
    this.activity.log({
      actor,
      action: 'mentors.featured',
      description: `${isFeatured ? 'Featured' : 'Unfeatured'} a mentor profile`,
      entityType: 'mentor profile',
      entityId: updated.id,
    });
    return updated;
  }
}
