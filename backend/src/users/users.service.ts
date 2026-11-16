import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { PrismaService } from '../common/services/prisma.service';
import {
  AssignmentStatus,
  PaymentStatus,
  Role,
  TicketStatus,
} from '@prisma/client';
import { MailService } from '../common/services/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeService } from '../realtime/realtime.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService,
    private readonly realtime: RealtimeService,
  ) {}

  async findAll(params: {
    page?: number;
    limit?: number;
    role?: Role;
    search?: string;
  }) {
    const page = params.page || 1;
    const limit = Math.min(params.limit || 10, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.role) where.role = params.role;
    if (params.search) {
      where.OR = [
        { email: { contains: params.search, mode: 'insensitive' } },
        { firstName: { contains: params.search, mode: 'insensitive' } },
        { lastName: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          permissions: true,
          avatar: true,
          phone: true,
          bio: true,
          location: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              enrollments: true,
              certificates: true,
              courses: true,
              instructedCourses: true,
              supportTickets: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        permissions: true,
        avatar: true,
        phone: true,
        bio: true,
        location: true,
        website: true,
        github: true,
        linkedin: true,
        twitter: true,
        hourlyRate: true,
        availability: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            enrollments: true,
            certificates: true,
            courses: true,
            supportTickets: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Full admin edit of another account. Superadmin-only at the controller
   * level; includes identity, role, capabilities and profile photo.
   */
  async adminUpdateUser(userId: string, data: any) {
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });
    if (!existing) throw new NotFoundException('User not found');

    const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
    if (email && email !== existing.email) {
      const clash = await this.prisma.user.findUnique({ where: { email } });
      if (clash) throw new ConflictException('That email address is already in use');
    }

    const roles = Object.values(Role);
    const role = roles.includes(data.role) ? (data.role as Role) : undefined;
    if (data.role && !role) throw new BadRequestException('Invalid role');

    const allowedPermissions = [
      'MANAGE_COURSES', 'MANAGE_STUDENTS', 'MANAGE_BLOG', 'MANAGE_JOBS',
      'MANAGE_SUPPORT', 'MANAGE_PAYMENTS', 'MANAGE_TALENT', 'MANAGE_CHAT',
      'MANAGE_CERTIFICATES', 'GRADE_ASSIGNMENTS', 'MANAGE_USERS', 'MANAGE_SETTINGS',
    ];
    const permissions: string[] | undefined = Array.isArray(data.permissions)
      ? Array.from(
          new Set(
            data.permissions
              .map((item: unknown) => String(item))
              .filter((item: string) => allowedPermissions.includes(item)),
          ),
        )
      : undefined;

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: email || undefined,
        firstName:
          typeof data.firstName === 'string' && data.firstName.trim()
            ? data.firstName.trim()
            : undefined,
        lastName:
          typeof data.lastName === 'string' && data.lastName.trim()
            ? data.lastName.trim()
            : undefined,
        phone: data.phone === undefined ? undefined : data.phone || null,
        bio: data.bio === undefined ? undefined : data.bio || null,
        location: data.location === undefined ? undefined : data.location || null,
        website: data.website === undefined ? undefined : data.website || null,
        avatar:
          data.avatar === undefined
            ? undefined
            : data.avatar === '' || data.avatar === null
            ? null
            : typeof data.avatar === 'string' && data.avatar.length <= 600
            ? data.avatar
            : undefined,
        role,
        permissions:
          permissions === undefined
            ? undefined
            : role === Role.STUDENT
            ? []
            : permissions,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        permissions: true,
        avatar: true,
        phone: true,
        bio: true,
        location: true,
        isActive: true,
        updatedAt: true,
      },
    });

    if (role || permissions !== undefined) {
      await this.realtime.trigger(`private-user-${userId}`, 'account:updated', {
        permissions: updated.permissions,
        role: updated.role,
      });
    }
    return updated;
  }

  async updateRole(userId: string, role: Role) {
    // Promoting to ADMIN grants the standard management surface by default.
    // A superadmin can still fine-tune or remove capabilities afterwards.
    const adminDefaults = [
      'MANAGE_COURSES',
      'MANAGE_STUDENTS',
      'MANAGE_BLOG',
      'MANAGE_JOBS',
      'MANAGE_SUPPORT',
      'MANAGE_PAYMENTS',
      'MANAGE_TALENT',
      'MANAGE_CHAT',
      'MANAGE_CERTIFICATES',
      'GRADE_ASSIGNMENTS',
      'MANAGE_USERS',
      'MANAGE_SETTINGS',
    ];

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        role,
        permissions:
          role === Role.ADMIN
            ? adminDefaults
            : role === Role.STUDENT
            ? []
            : undefined,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        permissions: true,
      },
    });
    await this.realtime.trigger(`private-user-${userId}`, 'account:updated', {
      permissions: updated.permissions,
      role: updated.role,
    });
    return updated;
  }

  async updatePermissions(userId: string, permissions: string[]) {
    const allowed = [
      'MANAGE_COURSES',
      'MANAGE_STUDENTS',
      'MANAGE_BLOG',
      'MANAGE_JOBS',
      'MANAGE_SUPPORT',
      'MANAGE_PAYMENTS',
      'MANAGE_TALENT',
      'MANAGE_CHAT',
      'MANAGE_CERTIFICATES',
      'GRADE_ASSIGNMENTS',
      'MANAGE_USERS',
      'MANAGE_SETTINGS',
    ];
    const clean = Array.from(
      new Set((permissions || []).filter((p) => allowed.includes(p))),
    );

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { permissions: clean },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        permissions: true,
      },
    });
    await this.realtime.trigger(`private-user-${userId}`, 'account:updated', {
      permissions: updated.permissions,
      role: updated.role,
    });
    return updated;
  }

  async create(data: {
    email: string;
    firstName: string;
    lastName: string;
    role?: Role;
    permissions?: string[];
    phone?: string;
    bio?: string;
    location?: string;
  }) {
    if (!data.email || !data.firstName || !data.lastName) {
      throw new BadRequestException('Email, first name and last name are required');
    }
    if (data.role && !Object.values(Role).includes(data.role)) {
      throw new BadRequestException('Invalid role');
    }
    const email = data.email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new BadRequestException('Email already registered');

    const temporaryPassword = `TT-${randomBytes(4).toString('hex')}!`;
    const saltRounds = parseInt(this.config.get('BCRYPT_SALT_ROUNDS', '10'), 10);
    const password = await bcrypt.hash(temporaryPassword, saltRounds);

    const user = await this.prisma.user.create({
      data: {
        email,
        password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role || Role.STUDENT,
        permissions: data.permissions || [],
        phone: data.phone,
        bio: data.bio,
        location: data.location,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        permissions: true,
        createdAt: true,
      },
    });

    await this.mail.sendTemplate('welcome', email, {
      firstName: user.firstName,
      temporaryPassword,
      url: `${this.config.get('FRONTEND_URL') || 'http://localhost:3000'}/login`,
      buttonLabel: 'Sign in',
    });

    return { user, temporaryPassword };
  }

  async toggleActive(
    userId: string,
    actor: { sub: string; role: Role },
    reason?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');
    if (user.id === actor.sub) {
      throw new BadRequestException('You cannot disable your own account');
    }
    if (user.role === Role.SUPERADMIN && actor.role !== Role.SUPERADMIN) {
      throw new ForbiddenException('Only a superadmin can disable a superadmin');
    }

    const nextActive = !user.isActive;

    if (!nextActive) {
      await this.prisma.passwordResetToken.deleteMany({ where: { userId } });
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: nextActive,
        disabledAt: nextActive ? null : new Date(),
        disabledReason: nextActive ? null : reason || 'Disabled by an administrator',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        disabledAt: true,
        disabledReason: true,
      },
    });

    await this.realtime.trigger(
      `private-user-${userId}`,
      nextActive ? 'account:enabled' : 'account:disabled',
      {
        isActive: nextActive,
        reason: updated.disabledReason,
        disabledAt: updated.disabledAt,
      },
    );
    await this.realtime.trigger('private-admin', 'user:updated', {
      userId,
      isActive: nextActive,
      role: updated.role,
    });

    if (nextActive) {
      await this.notifications.create({
        userId,
        type: 'ACCOUNT',
        title: 'Account re-enabled',
        body: 'An administrator restored your account. Welcome back!',
        link: '/dashboard',
      });
    } else {
      await this.notifications.create({
        userId,
        type: 'ACCOUNT',
        title: 'Account disabled',
        body: reason || 'Contact support if you think this is a mistake.',
      });
      await this.mail.sendTemplate('account-disabled', user.email, {
        firstName: user.firstName,
        reason: reason || 'Disabled by an administrator',
      });
    }

    return updated;
  }

  async getInstructors() {
    return this.prisma.user.findMany({
      where: {
        role: { in: [Role.STAFF, Role.ADMIN, Role.SUPERADMIN] },
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        hourlyRate: true,
        availability: true,
        _count: {
          select: { courses: true, instructedCourses: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateProfile(userId: string, data: any) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        // Identity fields (email, name, role) stay admin-only. Users may
        // upload their own avatar URL; it is length-checked before saving.
        avatar:
          typeof data.avatar === 'string' && data.avatar.length <= 600
            ? data.avatar || null
            : undefined,
        phone: data.phone,
        bio: data.bio,
        location: data.location,
        website: data.website,
        github: data.github,
        linkedin: data.linkedin,
        twitter: data.twitter,
        hourlyRate:
          data.hourlyRate === undefined || data.hourlyRate === ''
            ? undefined
            : parseFloat(data.hourlyRate),
        availability: data.availability,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        permissions: true,
        avatar: true,
        phone: true,
        bio: true,
        location: true,
        website: true,
        github: true,
        linkedin: true,
        twitter: true,
        hourlyRate: true,
        availability: true,
        updatedAt: true,
      },
    });
  }

  async getAdminDashboard() {
    const now = new Date();
    const startOfToday = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const since = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1),
    );

    const [
      users,
      students,
      staff,
      courses,
      publishedCourses,
      enrollments,
      certificates,
      pendingSubmissions,
      awaitingPayments,
      openTickets,
      mentors,
      upcomingSessions,
      attendanceRows,
      recentLogs,
      recentUsers,
      topCourses,
      revenueByCurrency,
      enrollmentRows,
      upcoming,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: Role.STUDENT } }),
      this.prisma.user.count({ where: { role: { in: [Role.STAFF, Role.ADMIN] } } }),
      this.prisma.course.count(),
      this.prisma.course.count({ where: { isPublished: true } }),
      this.prisma.enrollment.count(),
      this.prisma.certificate.count(),
      this.prisma.assignmentSubmission.count({
        where: { status: AssignmentStatus.SUBMITTED },
      }),
      this.prisma.payment.count({
        where: { status: PaymentStatus.AWAITING_APPROVAL },
      }),
      this.prisma.supportTicket.count({
        where: { status: { in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS] } },
      }),
      this.prisma.mentorProfile.count({ where: { isPublished: true } }),
      this.prisma.liveSession.count({
        where: { startTime: { gte: now }, isCancelled: false },
      }),
      this.prisma.attendanceRecord.groupBy({
        by: ['isPresent'],
        where: { date: startOfToday },
        _count: { _all: true },
      }),
      this.prisma.activityLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: {
          actor: {
            select: { id: true, firstName: true, lastName: true, avatar: true, role: true },
          },
        },
      }),
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
          role: true,
          createdAt: true,
        },
      }),
      this.prisma.course.findMany({
        where: { isPublished: true },
        take: 5,
        orderBy: { enrollments: { _count: 'desc' } },
        select: {
          id: true,
          title: true,
          thumbnail: true,
          price: true,
          currency: true,
          type: true,
          _count: { select: { enrollments: true } },
        },
      }),
      this.prisma.payment.groupBy({
        by: ['currency'],
        where: { status: PaymentStatus.COMPLETED },
        _sum: { amount: true },
      }),
      this.prisma.enrollment.findMany({
        where: { enrolledAt: { gte: since } },
        select: { enrolledAt: true },
      }),
      this.prisma.liveSession.findMany({
        where: { startTime: { gte: now }, isCancelled: false },
        orderBy: { startTime: 'asc' },
        take: 4,
        select: {
          id: true,
          title: true,
          startTime: true,
          meetingUrl: true,
          course: { select: { id: true, title: true } },
          instructor: { select: { firstName: true, lastName: true } },
        },
      }),
    ]);

    const present = attendanceRows.find((row) => row.isPresent)?._count._all || 0;
    const absent = attendanceRows.find((row) => !row.isPresent)?._count._all || 0;

    const months: Array<{ key: string; label: string; count: number }> = [];
    for (let index = 5; index >= 0; index -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
      months.push({
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        label: date.toLocaleDateString('en-US', { month: 'short' }),
        count: 0,
      });
    }
    enrollmentRows.forEach((row) => {
      const key = `${row.enrolledAt.getFullYear()}-${String(
        row.enrolledAt.getMonth() + 1,
      ).padStart(2, '0')}`;
      const bucket = months.find((item) => item.key === key);
      if (bucket) bucket.count += 1;
    });

    return {
      stats: {
        users,
        students,
        staff,
        courses,
        publishedCourses,
        enrollments,
        certificates,
        pendingSubmissions,
        awaitingPayments,
        openTickets,
        mentors,
        upcomingSessions,
      },
      attendanceToday: {
        present,
        absent,
        marked: present + absent,
        rate: present + absent ? Math.round((present / (present + absent)) * 100) : 0,
      },
      revenue: revenueByCurrency.map((row) => ({
        currency: row.currency,
        amount: row._sum.amount || 0,
      })),
      trend: months,
      topCourses,
      recentUsers,
      recentLogs,
      upcoming,
    };
  }

  async getStudentDashboard(userId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            type: true,
            price: true,
            thumbnail: true,
            instructor: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        certificate: true,
        _count: {
          select: { lessons: true },
        },
      },
      orderBy: { lastAccessedAt: 'desc' },
    });

    const certificates = await this.prisma.certificate.findMany({
      where: { userId },
      include: {
        course: { select: { id: true, title: true, slug: true } },
      },
    });

    return { enrollments, certificates };
  }

  async getStaffDashboard(userId: string) {
    const courses = await this.prisma.course.findMany({
      where: {
        OR: [
          { instructorId: userId },
          { instructors: { some: { userId } } },
        ],
      },
      include: {
        category: { select: { id: true, name: true } },
        _count: {
          select: { enrollments: true, modules: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const courseIds = courses.map((course) => course.id);
    if (courseIds.length === 0) {
      return {
        courses: [],
        recentStudents: [],
        recentSubmissions: [],
        stats: { courses: 0, students: 0, modules: 0, pendingSubmissions: 0 },
      };
    }

    const [recentStudents, recentSubmissions, pendingSubmissions] = await Promise.all([
      this.prisma.enrollment.findMany({
        where: { courseId: { in: courseIds } },
        take: 5,
        orderBy: { enrolledAt: 'desc' },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
          },
          course: { select: { id: true, title: true } },
        },
      }),
      this.prisma.assignmentSubmission.findMany({
        where: { assignment: { courseId: { in: courseIds } } },
        take: 5,
        orderBy: { submittedAt: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          assignment: {
            select: {
              id: true,
              title: true,
              maxScore: true,
              course: { select: { id: true, title: true } },
            },
          },
        },
      }),
      this.prisma.assignmentSubmission.count({
        where: {
          status: AssignmentStatus.SUBMITTED,
          assignment: { courseId: { in: courseIds } },
        },
      }),
    ]);

    return {
      courses,
      recentStudents,
      recentSubmissions,
      stats: {
        courses: courses.length,
        students: courses.reduce((sum, course) => sum + course._count.enrollments, 0),
        modules: courses.reduce((sum, course) => sum + course._count.modules, 0),
        pendingSubmissions,
      },
    };
  }
}
