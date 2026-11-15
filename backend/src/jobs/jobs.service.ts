import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { JobApplicationStatus, JobType, Role } from '@prisma/client';
import { RealtimeService } from '../realtime/realtime.service';

@Injectable()
export class JobsService {
  constructor(
    private prisma: PrismaService,
    private readonly realtime: RealtimeService,
  ) {}

  private generateSlug(title: string, company: string): string {
    return `${title}-${company}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    type?: JobType;
    level?: string;
    isRemote?: boolean;
    isFeatured?: boolean;
    publishedOnly?: boolean;
  }) {
    const page = params.page || 1;
    const limit = Math.min(params.limit || 12, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.publishedOnly !== false) where.isPublished = true;
    if (params.type) where.type = params.type;
    if (params.level) where.level = params.level;
    if (params.isRemote !== undefined) where.isRemote = params.isRemote;
    if (params.isFeatured !== undefined) where.isFeatured = params.isFeatured;
    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { company: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
        { tags: { contains: params.search, mode: 'insensitive' } },
        { location: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [jobs, total] = await this.prisma.$transaction([
      this.prisma.job.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        include: {
          postedBy: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { applications: true } },
        },
      }),
      this.prisma.job.count({ where }),
    ]);

    return {
      jobs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findBySlug(slug: string) {
    const job = await this.prisma.job.findUnique({
      where: { slug },
      include: {
        postedBy: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { applications: true } },
      },
    });
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  async findById(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        postedBy: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { applications: true } },
      },
    });
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  async create(data: any, postedById: string) {
    if (!data.title || !data.company || !data.description) {
      throw new BadRequestException('Title, company and description are required');
    }
    let slug = data.slug || this.generateSlug(data.title, data.company);
    const existing = await this.prisma.job.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now().toString(36)}`;

    return this.prisma.job.create({
      data: {
        title: data.title,
        slug,
        company: data.company,
        companyLogo: data.companyLogo,
        companyWebsite: data.companyWebsite,
        location: data.location || 'Remote',
        isRemote: data.isRemote === true || data.isRemote === 'true',
        type: data.type || JobType.FULL_TIME,
        level: data.level,
        salaryMin: data.salaryMin ? parseFloat(data.salaryMin) : null,
        salaryMax: data.salaryMax ? parseFloat(data.salaryMax) : null,
        currency: data.currency || 'USD',
        description: data.description,
        requirements: data.requirements,
        responsibilities: data.responsibilities,
        benefits: data.benefits,
        tags: data.tags,
        deadline: data.deadline ? new Date(data.deadline) : null,
        isPublished: data.isPublished === true || data.isPublished === 'true',
        isFeatured: data.isFeatured === true || data.isFeatured === 'true',
        publishedAt:
          data.isPublished === true || data.isPublished === 'true'
            ? new Date()
            : null,
        postedById,
      },
    });
  }

  async update(id: string, data: any, userId: string, role: Role, permissions: string[] = []) {
    const job = await this.prisma.job.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('Job not found');

    const canManage = role === Role.SUPERADMIN || permissions.includes('MANAGE_JOBS');
    if (!canManage && job.postedById !== userId) {
      throw new ForbiddenException('You cannot edit this job');
    }

    return this.prisma.job.update({
      where: { id },
      data: {
        title: data.title ?? undefined,
        company: data.company ?? undefined,
        companyLogo: data.companyLogo ?? undefined,
        companyWebsite: data.companyWebsite ?? undefined,
        location: data.location ?? undefined,
        isRemote: data.isRemote === undefined ? undefined : data.isRemote === true || data.isRemote === 'true',
        type: data.type ?? undefined,
        level: data.level ?? undefined,
        salaryMin: data.salaryMin === undefined ? undefined : data.salaryMin ? parseFloat(data.salaryMin) : null,
        salaryMax: data.salaryMax === undefined ? undefined : data.salaryMax ? parseFloat(data.salaryMax) : null,
        currency: data.currency ?? undefined,
        description: data.description ?? undefined,
        requirements: data.requirements ?? undefined,
        responsibilities: data.responsibilities ?? undefined,
        benefits: data.benefits ?? undefined,
        tags: data.tags ?? undefined,
        deadline: data.deadline === undefined ? undefined : data.deadline ? new Date(data.deadline) : null,
        isPublished: data.isPublished === undefined ? undefined : data.isPublished === true || data.isPublished === 'true',
        isFeatured: data.isFeatured === undefined ? undefined : data.isFeatured === true || data.isFeatured === 'true',
      },
    });
  }

  async remove(id: string) {
    const job = await this.prisma.job.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('Job not found');
    await this.prisma.job.delete({ where: { id } });
    return { deleted: true };
  }

  async apply(jobId: string, userId: string, data: any) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job || !job.isPublished) throw new NotFoundException('Job not found');

    const existing = await this.prisma.jobApplication.findUnique({
      where: { jobId_userId: { jobId, userId } },
    });
    if (existing) throw new BadRequestException('You have already applied to this job');

    const application = await this.prisma.jobApplication.create({
      data: {
        jobId,
        userId,
        coverLetter: data.coverLetter,
        resumeUrl: data.resumeUrl,
        portfolioUrl: data.portfolioUrl,
      },
      include: {
        job: { select: { id: true, title: true, company: true } },
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
    await this.realtime.trigger('private-admin', 'application:new', application);
    await this.realtime.trigger(`private-user-${userId}`, 'application:updated', {
      applicationId: application.id,
      status: application.status,
    });
    return application;
  }

  async myApplications(userId: string) {
    return this.prisma.jobApplication.findMany({
      where: { userId },
      include: {
        job: {
          select: { id: true, title: true, company: true, slug: true, location: true, type: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async applicationsForJob(jobId: string) {
    return this.prisma.jobApplication.findMany({
      where: { jobId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            bio: true,
            github: true,
            linkedin: true,
            website: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateApplication(id: string, data: { status: JobApplicationStatus; notes?: string }) {
    const updated = await this.prisma.jobApplication.update({
      where: { id },
      data: {
        status: data.status,
        notes: data.notes,
        reviewedAt: new Date(),
      },
    });
    await this.realtime.trigger(`private-user-${updated.userId}`, 'application:updated', {
      applicationId: updated.id,
      status: updated.status,
    });
    await this.realtime.trigger('private-admin', 'application:updated', updated);
    return updated;
  }
}
