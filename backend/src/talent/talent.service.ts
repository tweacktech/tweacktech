import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';

const USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  avatar: true,
  bio: true,
  location: true,
  github: true,
  linkedin: true,
  website: true,
  role: true,
};

@Injectable()
export class TalentService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    skill?: string;
    availability?: string;
    featured?: boolean;
    publishedOnly?: boolean;
  }) {
    const page = params.page || 1;
    const limit = Math.min(params.limit || 12, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.publishedOnly !== false) where.isPublished = true;
    if (params.availability && params.availability !== 'All') {
      where.availability = params.availability;
    }
    if (params.featured !== undefined) where.isFeatured = params.featured;
    if (params.skill && params.skill !== 'All') {
      where.skills = { has: params.skill };
    }
    if (params.search) {
      where.OR = [
        { headline: { contains: params.search, mode: 'insensitive' } },
        { bio: { contains: params.search, mode: 'insensitive' } },
        { location: { contains: params.search, mode: 'insensitive' } },
        { skills: { has: params.search } },
        { user: { firstName: { contains: params.search, mode: 'insensitive' } } },
        { user: { lastName: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    const [profiles, total] = await this.prisma.$transaction([
      this.prisma.talentProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        include: { user: { select: USER_SELECT } },
      }),
      this.prisma.talentProfile.count({ where }),
    ]);

    return {
      profiles,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  async findById(id: string, publicOnly = true) {
    const profile = await this.prisma.talentProfile.findUnique({
      where: { id },
      include: { user: { select: USER_SELECT } },
    });
    if (!profile || (publicOnly && !profile.isPublished)) {
      throw new NotFoundException('Talent profile not found');
    }
    return profile;
  }

  async findMine(userId: string) {
    const profile = await this.prisma.talentProfile.findUnique({
      where: { userId },
      include: { user: { select: USER_SELECT } },
    });
    if (!profile) throw new NotFoundException('You do not have a talent profile yet');
    return profile;
  }

  async create(data: any) {
    if (!data.userId) throw new BadRequestException('Select a user for this profile');
    if (!data.headline) throw new BadRequestException('A headline is required');
    const user = await this.prisma.user.findUnique({
      where: { id: data.userId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.talentProfile.upsert({
      where: { userId: data.userId },
      update: this.profileData(data),
      create: { userId: data.userId, ...this.profileData(data) },
      include: { user: { select: USER_SELECT } },
    });
  }

  async update(id: string, data: any) {
    await this.findById(id, false);
    return this.prisma.talentProfile.update({
      where: { id },
      data: this.profileData(data),
      include: { user: { select: USER_SELECT } },
    });
  }

  async remove(id: string) {
    await this.findById(id, false);
    await this.prisma.talentProfile.delete({ where: { id } });
    return { deleted: true };
  }

  async upsertMine(user: { sub: string; role: Role }, data: any) {
    if (!['STAFF', 'ADMIN', 'SUPERADMIN', 'STUDENT'].includes(user.role)) {
      throw new BadRequestException('Your role cannot create a talent profile');
    }

    return this.prisma.talentProfile.upsert({
      where: { userId: user.sub },
      update: this.profileData(data),
      create: { userId: user.sub, ...this.profileData(data) },
      include: { user: { select: USER_SELECT } },
    });
  }

  private profileData(data: any) {
    const skills = Array.isArray(data.skills)
      ? data.skills
      : typeof data.skills === 'string'
      ? data.skills.split(',').map((skill: string) => skill.trim()).filter(Boolean)
      : undefined;

    return {
      headline: data.headline ?? undefined,
      bio: data.bio,
      skills: skills ?? undefined,
      experienceYears:
        data.experienceYears === undefined || data.experienceYears === ''
          ? undefined
          : parseInt(data.experienceYears, 10),
      hourlyRate:
        data.hourlyRate === undefined || data.hourlyRate === ''
          ? undefined
          : parseFloat(data.hourlyRate),
      currency: data.currency ? String(data.currency).toUpperCase() : undefined,
      availability: data.availability,
      location: data.location,
      avatar: data.avatar,
      isPublished:
        data.isPublished === undefined
          ? undefined
          : data.isPublished === true || data.isPublished === 'true',
      isFeatured:
        data.isFeatured === undefined
          ? undefined
          : data.isFeatured === true || data.isFeatured === 'true',
    };
  }
}
