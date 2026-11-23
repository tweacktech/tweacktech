import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import {
  CourseType,
  EnrollmentStatus,
  LessonType,
  PaymentStatus,
  Prisma,
  Role,
} from '@prisma/client';
import {
  getPaginationParams,
  getPaginatedResponse,
} from '../common/utils/pagination';
import { NotificationsService } from '../notifications/notifications.service';
import { applyCoursePricing, effectivePrice } from '../common/utils/course-pricing';

const STAFF_ROLES: Role[] = [Role.SUPERADMIN, Role.ADMIN, Role.STAFF];

const COURSE_UPDATE_FIELDS = [
  'title',
  'slug',
  'shortDescription',
  'description',
  'type',
  'price',
  'currency',
  'discountPrice',
  'discountStart',
  'discountEnd',
  'enrollmentLocked',
  'enrollmentLockedMessage',
  'thumbnail',
  'level',
  'duration',
  'requirements',
  'outcomes',
  'targetAudience',
  'categoryId',
  'isPublished',
  'isFeatured',
] as const;

@Injectable()
export class CoursesService {
  private readonly logger = new Logger(CoursesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // -------------------------------------------------------------------------
  // Access control
  // -------------------------------------------------------------------------

  private async courseForManagement(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        instructorId: true,
        title: true,
        instructors: { select: { userId: true } },
      },
    });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  private canManage(
    course: { instructorId: string; instructors: Array<{ userId: string }> },
    userId: string,
    role: Role,
    _permissions: string[] = [],
  ) {
    if (role === Role.SUPERADMIN || role === Role.ADMIN) return true;
    // Staff are deliberately limited to courses they lead or co-teach.
    return (
      course.instructorId === userId ||
      course.instructors.some((row) => row.userId === userId)
    );
  }

  private async assertCanManage(
    courseId: string,
    user: { sub: string; role: Role; permissions?: string[] },
  ) {
    const course = await this.courseForManagement(courseId);
    if (!this.canManage(course, user.sub, user.role, user.permissions || [])) {
      throw new ForbiddenException('You do not manage this course');
    }
    return course;
  }

  // -------------------------------------------------------------------------
  // Courses
  // -------------------------------------------------------------------------

  async create(
    data: any,
    user: { sub: string; role: Role; permissions?: string[] },
  ) {
    if (!data.title || !data.description) {
      throw new BadRequestException('Title and description are required');
    }

    const isPrivileged =
      user.role === Role.SUPERADMIN ||
      user.role === Role.ADMIN ||
      (user.permissions || []).includes('MANAGE_COURSES');

    const instructorId =
      isPrivileged && data.instructorId ? data.instructorId : user.sub;

    const coInstructorIds: string[] = Array.from(
      new Set(
        (Array.isArray(data.coInstructorIds) ? data.coInstructorIds : [])
          .filter(Boolean)
          .filter((id: string) => id !== instructorId),
      ),
    );

    const slug = this.generateSlug(data.slug || data.title);
    const existing = await this.prisma.course.findUnique({ where: { slug } });
    const finalSlug = existing ? `${slug}-${Date.now().toString(36)}` : slug;

    const created = await this.prisma.course.create({
      data: {
        title: data.title,
        slug: finalSlug,
        shortDescription: data.shortDescription,
        description: data.description,
        type: data.type || CourseType.FREE,
        price: parseFloat(data.price || 0),
        currency: (data.currency || 'USD').toUpperCase(),
        discountPrice: data.discountPrice ? parseFloat(data.discountPrice) : null,
        discountStart: this.optionalDate(data.discountStart),
        discountEnd: this.optionalDate(data.discountEnd),
        enrollmentLocked:
          data.enrollmentLocked === true || data.enrollmentLocked === 'true',
        enrollmentLockedMessage: data.enrollmentLockedMessage,
        thumbnail: data.thumbnail,
        level: data.level || 'Beginner',
        duration: data.duration || 'Self paced',
        requirements: data.requirements,
        outcomes: data.outcomes,
        targetAudience: data.targetAudience,
        categoryId: data.categoryId || null,
        instructorId,
        isPublished: data.isPublished === 'true' || data.isPublished === true,
        publishedAt:
          data.isPublished === 'true' || data.isPublished === true
            ? new Date()
            : null,
        isFeatured: data.isFeatured === 'true' || data.isFeatured === true,
        instructors:
          coInstructorIds.length > 0
            ? { create: coInstructorIds.map((id) => ({ userId: id })) }
            : undefined,
      },
      include: {
        instructor: { select: { id: true, firstName: true, lastName: true } },
        instructors: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          },
        },
        category: true,
      },
    });

    return applyCoursePricing(created);
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    type?: CourseType;
    level?: string;
    categoryId?: string;
    search?: string;
    isPublished?: boolean;
    isFeatured?: boolean;
    instructorId?: string;
    staffUserId?: string;
  }) {
    const { page, limit, skip, sortBy, sortOrder } = getPaginationParams(params);

    const where: any = {};
    if (params.type) where.type = params.type;
    if (params.level) where.level = params.level;
    if (params.categoryId) where.categoryId = params.categoryId;
    if (params.instructorId) where.instructorId = params.instructorId;
    if (params.isPublished !== undefined) where.isPublished = params.isPublished;
    if (params.isFeatured !== undefined) where.isFeatured = params.isFeatured;
    const and: any[] = [];
    if (params.search) {
      and.push({
        OR: [
          { title: { contains: params.search, mode: 'insensitive' } },
          { description: { contains: params.search, mode: 'insensitive' } },
          { shortDescription: { contains: params.search, mode: 'insensitive' } },
        ],
      });
    }
    // Staff only ever see courses they lead or co-teach.
    if (params.staffUserId) {
      and.push({
        OR: [
          { instructorId: params.staffUserId },
          { instructors: { some: { userId: params.staffUserId } } },
        ],
      });
    }
    if (and.length > 0) where.AND = and;

    const [courses, total] = await this.prisma.$transaction([
      this.prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          instructor: {
            select: { id: true, firstName: true, lastName: true, avatar: true },
          },
          instructors: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
            },
          },
          category: true,
          _count: {
            select: { modules: true, enrollments: true, reviews: true },
          },
        },
      }),
      this.prisma.course.count({ where }),
    ]);

    return getPaginatedResponse(courses.map(applyCoursePricing), total, page, limit);
  }

  async findById(id: string, user?: { sub: string; role: Role }) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        instructor: {
          select: { id: true, firstName: true, lastName: true, avatar: true, bio: true },
        },
        instructors: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, avatar: true, bio: true },
            },
          },
        },
        category: true,
        modules: {
          where: { isPublished: true },
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              where: { isPublished: true },
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                description: true,
                readingContent: true,
                type: true,
                contentUrl: true,
                duration: true,
                order: true,
                isFree: true,
                isPublished: true,
                unlockAfterDays: true,
                unlockAt: true,
              },
            },
          },
        },
        _count: { select: { enrollments: true, reviews: true } },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          },
        },
      },
    });

    if (!course) throw new NotFoundException('Course not found');

    // The lesson player loads guides from this endpoint. Keep them readable
    // for enrolled learners and staff, but never expose lesson material to
    // anonymous or unenrolled callers scraping the public catalogue.
    const isManager =
      user?.role === Role.SUPERADMIN ||
      user?.role === Role.ADMIN ||
      user?.role === Role.STAFF;
    let canReadLessons = isManager;
    if (!canReadLessons && user?.sub) {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: user.sub, courseId: id } },
        select: { id: true },
      });
      canReadLessons = Boolean(enrollment);
    }
    if (!canReadLessons) {
      // Free preview lessons stay readable for everyone; everything else
      // requires an enrolment.
      course.modules.forEach((module) =>
        module.lessons.forEach((lesson) => {
          if (lesson.isFree) return;
          lesson.readingContent = null;
          lesson.contentUrl = null;
        }),
      );
    }

    return applyCoursePricing(course);
  }

  async getAdminById(id: string, user?: { sub: string; role: Role }) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        instructor: { select: { id: true, firstName: true, lastName: true, email: true } },
        instructors: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
          },
        },
        category: true,
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: { orderBy: { order: 'asc' } },
            assignments: { select: { id: true, title: true, type: true } },
          },
        },
        _count: { select: { enrollments: true, reviews: true, payments: true } },
      },
    });
    if (!course) throw new NotFoundException('Course not found');
    if (user?.role === Role.STAFF) {
      const owns =
        course.instructorId === user.sub ||
        (course.instructors || []).some((row) => row.userId === user.sub);
      if (!owns) throw new ForbiddenException('You only manage courses assigned to you');
    }
    return applyCoursePricing(course);
  }

  async findBySlug(slug: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      include: {
        instructor: {
          select: { id: true, firstName: true, lastName: true, avatar: true, bio: true },
        },
        instructors: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          },
        },
        category: true,
        modules: {
          orderBy: { order: 'asc' },
          include: { lessons: { orderBy: { order: 'asc' } } },
        },
        _count: { select: { enrollments: true, reviews: true } },
      },
    });
    if (!course) throw new NotFoundException('Course not found');
    return applyCoursePricing(course);
  }

  async update(
    id: string,
    data: any,
    user: { sub: string; role: Role; permissions?: string[] },
  ) {
    await this.assertCanManage(id, user);

    const payload: any = {};
    for (const field of COURSE_UPDATE_FIELDS) {
      if (data[field] !== undefined) payload[field] = data[field];
    }

    if (payload.slug) payload.slug = this.generateSlug(payload.slug);
    if (payload.price !== undefined) payload.price = parseFloat(payload.price || 0);
    if (payload.discountPrice !== undefined) {
      payload.discountPrice = payload.discountPrice
        ? parseFloat(payload.discountPrice)
        : null;
    }
    if (payload.discountStart !== undefined) {
      payload.discountStart = this.optionalDate(payload.discountStart);
    }
    if (payload.discountEnd !== undefined) {
      payload.discountEnd = this.optionalDate(payload.discountEnd);
    }
    if (payload.enrollmentLocked !== undefined) {
      payload.enrollmentLocked =
        payload.enrollmentLocked === true || payload.enrollmentLocked === 'true';
    }
    if (payload.currency) payload.currency = payload.currency.toUpperCase();
    if (payload.categoryId === '') payload.categoryId = null;
    if (payload.isPublished !== undefined) {
      payload.isPublished =
        payload.isPublished === true || payload.isPublished === 'true';
      if (payload.isPublished) payload.publishedAt = new Date();
    }
    if (payload.isFeatured !== undefined) {
      payload.isFeatured =
        payload.isFeatured === true || payload.isFeatured === 'true';
    }

    // Only privileged staff can transfer course ownership.
    if (
      data.instructorId &&
      (user.role === Role.SUPERADMIN || user.role === Role.ADMIN)
    ) {
      payload.instructorId = data.instructorId;
    }

    const updated = await this.prisma.course.update({
      where: { id },
      data: payload,
      include: {
        instructor: { select: { id: true, firstName: true, lastName: true } },
        instructors: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        category: true,
      },
    });
    return applyCoursePricing(updated);
  }

  async setInstructors(
    courseId: string,
    data: { instructorId?: string; coInstructorIds?: string[] },
    actor?: { sub: string; role: Role; permissions?: string[] },
  ) {
    const course = await this.courseForManagement(courseId);
    if (actor && actor.role === Role.STAFF) {
      const ownsCourse =
        course.instructorId === actor.sub ||
        course.instructors.some((row) => row.userId === actor.sub);
      if (!ownsCourse) {
        throw new ForbiddenException('You do not manage this course');
      }
      // Only admins can transfer course ownership.
      data.instructorId = undefined;
    }
    const leadId = data.instructorId || course.instructorId;
    const coIds = Array.from(
      new Set((data.coInstructorIds || []).filter(Boolean)),
    ).filter((id) => id !== leadId);

    await this.prisma.$transaction([
      this.prisma.course.update({
        where: { id: courseId },
        data: { instructorId: leadId },
      }),
      this.prisma.courseInstructor.deleteMany({ where: { courseId } }),
      ...(coIds.length > 0
        ? [
            this.prisma.courseInstructor.createMany({
              data: coIds.map((userId) => ({ courseId, userId })),
              skipDuplicates: true,
            }),
          ]
        : []),
    ]);

    return this.getAdminById(courseId);
  }

  async delete(id: string, user: { sub: string; role: Role; permissions?: string[] }) {
    await this.assertCanManage(id, user);

    // Several relations default to RESTRICT, so remove dependants explicitly
    // before the course itself (modules, assignments, sessions, invitations,
    // chat rooms and attendance cascade automatically).
    await this.prisma.$transaction([
      this.prisma.certificate.deleteMany({ where: { courseId: id } }),
      this.prisma.payment.deleteMany({ where: { courseId: id } }),
      this.prisma.courseReview.deleteMany({ where: { courseId: id } }),
      this.prisma.liveSession.deleteMany({ where: { courseId: id } }),
      this.prisma.enrollment.deleteMany({ where: { courseId: id } }),
      this.prisma.course.delete({ where: { id } }),
    ]);
    return { deleted: true };
  }

  async getMyCourses(userId: string, userRole: Role) {
    const where: any = {};
    if (userRole === Role.STAFF) {
      where.OR = [{ instructorId: userId }, { instructors: { some: { userId } } }];
    } else if (userRole === Role.STUDENT) {
      where.enrollments = { some: { userId } };
    }

    const courses = await this.prisma.course.findMany({
      where,
      include: {
        _count: { select: { enrollments: true, modules: true } },
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return courses.map(applyCoursePricing);
  }

  // -------------------------------------------------------------------------
  // Modules & lessons
  // -------------------------------------------------------------------------

  async createModule(
    courseId: string,
    data: any,
    user: { sub: string; role: Role; permissions?: string[] },
  ) {
    await this.assertCanManage(courseId, user);
    const last = await this.prisma.module.findFirst({
      where: { courseId },
      orderBy: { order: 'desc' },
    });

    return this.prisma.module.create({
      data: {
        courseId,
        title: data.title,
        description: data.description,
        order:
          data.order !== undefined && data.order !== ''
            ? parseInt(data.order, 10)
            : (last?.order || 0) + 1,
        isPublished: data.isPublished === undefined ? true : data.isPublished === true || data.isPublished === 'true',
        unlockAfterDays: this.optionalInt(data.unlockAfterDays),
        unlockAt: this.optionalDate(data.unlockAt),
      },
      include: { lessons: true },
    });
  }

  async updateModule(
    moduleId: string,
    data: any,
    user: { sub: string; role: Role; permissions?: string[] },
  ) {
    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
      select: { courseId: true },
    });
    if (!module) throw new NotFoundException('Module not found');
    await this.assertCanManage(module.courseId, user);

    return this.prisma.module.update({
      where: { id: moduleId },
      data: {
        title: data.title,
        description: data.description,
        order:
          data.order === undefined || data.order === ''
            ? undefined
            : parseInt(data.order, 10),
        isPublished:
          data.isPublished === undefined
            ? undefined
            : data.isPublished === true || data.isPublished === 'true',
        unlockAfterDays:
          data.unlockAfterDays === undefined
            ? undefined
            : this.optionalInt(data.unlockAfterDays),
        unlockAt:
          data.unlockAt === undefined ? undefined : this.optionalDate(data.unlockAt),
      },
    });
  }

  async deleteModule(
    moduleId: string,
    user: { sub: string; role: Role; permissions?: string[] },
  ) {
    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
      select: { courseId: true },
    });
    if (!module) throw new NotFoundException('Module not found');
    await this.assertCanManage(module.courseId, user);
    await this.prisma.module.delete({ where: { id: moduleId } });
    return { deleted: true };
  }

  async createLesson(
    moduleId: string,
    data: any,
    user: { sub: string; role: Role; permissions?: string[] },
  ) {
    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
      select: { courseId: true },
    });
    if (!module) throw new NotFoundException('Module not found');
    await this.assertCanManage(module.courseId, user);

    const last = await this.prisma.lesson.findFirst({
      where: { moduleId },
      orderBy: { order: 'desc' },
    });

    return this.prisma.lesson.create({
      data: {
        moduleId,
        title: data.title,
        description: data.description,
        readingContent: data.readingContent,
        type: data.type || LessonType.VIDEO,
        contentUrl: data.contentUrl,
        contentType: data.contentType,
        fileSize: this.optionalInt(data.fileSize),
        duration: this.optionalInt(data.duration),
        order:
          data.order !== undefined && data.order !== ''
            ? parseInt(data.order, 10)
            : (last?.order || 0) + 1,
        isFree: data.isFree === 'true' || data.isFree === true,
        isPublished:
          data.isPublished === undefined
            ? true
            : data.isPublished === 'true' || data.isPublished === true,
        unlockAfterDays: this.optionalInt(data.unlockAfterDays),
        unlockAt: this.optionalDate(data.unlockAt),
      },
    });
  }

  async updateLesson(
    lessonId: string,
    data: any,
    user: { sub: string; role: Role; permissions?: string[] },
  ) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { select: { courseId: true } } },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    await this.assertCanManage(lesson.module.courseId, user);

    let nextModuleId: string | undefined;
    if (data.moduleId && data.moduleId !== lesson.moduleId) {
      const target = await this.prisma.module.findUnique({
        where: { id: data.moduleId },
        select: { courseId: true },
      });
      if (!target || target.courseId !== lesson.module.courseId) {
        throw new BadRequestException('Target module belongs to another course');
      }
      nextModuleId = data.moduleId;
    }

    return this.prisma.lesson.update({
      where: { id: lessonId },
      data: {
        moduleId: nextModuleId,
        title: data.title,
        description: data.description,
        readingContent: data.readingContent,
        type: data.type,
        contentUrl: data.contentUrl,
        contentType: data.contentType,
        duration:
          data.duration === undefined ? undefined : this.optionalInt(data.duration),
        order:
          data.order === undefined || data.order === ''
            ? undefined
            : parseInt(data.order, 10),
        isFree:
          data.isFree === undefined
            ? undefined
            : data.isFree === 'true' || data.isFree === true,
        isPublished:
          data.isPublished === undefined
            ? undefined
            : data.isPublished === 'true' || data.isPublished === true,
        unlockAfterDays:
          data.unlockAfterDays === undefined
            ? undefined
            : this.optionalInt(data.unlockAfterDays),
        unlockAt:
          data.unlockAt === undefined ? undefined : this.optionalDate(data.unlockAt),
      },
    });
  }

  async deleteLesson(
    lessonId: string,
    user: { sub: string; role: Role; permissions?: string[] },
  ) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { select: { courseId: true } } },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    await this.assertCanManage(lesson.module.courseId, user);
    await this.prisma.lesson.delete({ where: { id: lessonId } });
    return { deleted: true };
  }

  async reorderLessons(
    moduleId: string,
    lessonIds: string[],
    user: { sub: string; role: Role; permissions?: string[] },
  ) {
    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
      select: { courseId: true },
    });
    if (!module) throw new NotFoundException('Module not found');
    await this.assertCanManage(module.courseId, user);

    await this.prisma.$transaction(
      lessonIds.map((id, index) =>
        this.prisma.lesson.update({
          where: { id },
          data: { order: index + 1 },
        }),
      ),
    );
    return { reordered: true };
  }

  // -------------------------------------------------------------------------
  // Student access state (unlock schedule, completion, certificate)
  // -------------------------------------------------------------------------

  async getAccess(
    courseId: string,
    user: { sub: string; role: Role; permissions?: string[] },
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        type: true,
        price: true,
        currency: true,
        discountPrice: true,
        discountStart: true,
        discountEnd: true,
        enrollmentLocked: true,
        enrollmentLockedMessage: true,
        instructorId: true,
        modules: {
          where: { isPublished: true },
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            unlockAfterDays: true,
            unlockAt: true,
            lessons: {
              where: { isPublished: true },
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                isFree: true,
                unlockAfterDays: true,
                unlockAt: true,
              },
            },
          },
        },
      },
    });
    if (!course) throw new NotFoundException('Course not found');

    const enrollment = await this.prisma.enrollment.findFirst({
      where: { userId: user.sub, courseId },
      include: {
        certificate: true,
        lessons: { select: { lessonId: true, isCompleted: true, progress: true } },
      },
    });

    if (!enrollment) {
      return {
        enrolled: false,
        enrollment: null,
        certificate: null,
        certificateEligible: false,
        paid: false,
        progress: 0,
        lessons: [],
        nextLessonId: null,
        effectivePrice: effectivePrice(course),
        enrollmentLocked: course.enrollmentLocked,
        enrollmentLockedMessage: course.enrollmentLockedMessage,
      };
    }

    const paidPayment = await this.prisma.payment.findFirst({
      where: { userId: user.sub, courseId, status: PaymentStatus.COMPLETED },
      select: { id: true },
    });

    const dayMs = 24 * 60 * 60 * 1000;
    const progressMap = new Map(
      enrollment.lessons.map((row) => [row.lessonId, row]),
    );

    // Module quizzes gate the following module. A module without a quiz never
    // blocks progress (older courses remain usable).
    const moduleQuizzes = await this.prisma.assignment.findMany({
      where: { courseId, type: 'QUIZ', moduleId: { not: null } },
      select: { id: true, moduleId: true, passScore: true },
    });
    const quizSubmissions = moduleQuizzes.length
      ? await this.prisma.assignmentSubmission.findMany({
          where: {
            userId: user.sub,
            assignmentId: { in: moduleQuizzes.map((quiz) => quiz.id) },
          },
          select: { assignmentId: true, score: true },
        })
      : [];
    const passedModules = new Set<string>();
    for (const quiz of moduleQuizzes) {
      const submission = quizSubmissions.find((row) => row.assignmentId === quiz.id);
      if (
        quiz.moduleId &&
        submission &&
        typeof submission.score === 'number' &&
        submission.score >= Number(quiz.passScore || 6)
      ) {
        passedModules.add(quiz.moduleId);
      }
    }
    const quizByModule = new Map(
      moduleQuizzes
        .filter((quiz) => quiz.moduleId)
        .map((quiz) => [quiz.moduleId as string, quiz]),
    );

    const lessons = course.modules.flatMap((module, moduleIndex) =>
      module.lessons.map((lesson) => {
        const relativeDays =
          (module.unlockAfterDays || 0) + (lesson.unlockAfterDays || 0);
        let unlockTime =
          new Date(enrollment.enrolledAt).getTime() + relativeDays * dayMs;
        for (const value of [module.unlockAt, lesson.unlockAt].filter(Boolean)) {
          unlockTime = Math.max(unlockTime, new Date(value as Date).getTime());
        }
        const previousModule = course.modules[moduleIndex - 1];
        const previousHasQuiz = Boolean(
          previousModule && quizByModule.has(previousModule.id),
        );
        const previousPassed =
          !previousModule || !previousHasQuiz || passedModules.has(previousModule.id);
        const isUnlocked =
          (lesson.isFree || Date.now() >= unlockTime) && previousPassed;
        const row = progressMap.get(lesson.id);
        return {
          id: lesson.id,
          title: lesson.title,
          moduleId: module.id,
          isUnlocked,
          unlockAt: new Date(unlockTime).toISOString(),
          isCompleted: Boolean(row?.isCompleted),
          progress: row?.progress || 0,
        };
      }),
    );

    const nextLesson = lessons.find(
      (lesson) => lesson.isUnlocked && !lesson.isCompleted,
    );

    const certificateEligible =
      course.type !== CourseType.FREE &&
      enrollment.progress >= 100 &&
      Boolean(paidPayment);

    return {
      enrolled: true,
      enrollment: {
        id: enrollment.id,
        status: enrollment.status,
        progress: enrollment.progress,
        enrolledAt: enrollment.enrolledAt,
        completedAt: enrollment.completedAt,
      },
      certificate: enrollment.certificate,
      certificateEligible,
      paid: Boolean(paidPayment),
      progress: enrollment.progress,
      lessons,
      modules: course.modules.map((module) => {
        const quiz = quizByModule.get(module.id);
        const submission = quiz
          ? quizSubmissions.find((row) => row.assignmentId === quiz.id)
          : null;
        return {
          id: module.id,
          title: module.title,
          quizId: quiz?.id || null,
          quizPassed: passedModules.has(module.id),
          quizAttempted: Boolean(submission),
          quizScore: typeof submission?.score === 'number' ? submission.score : null,
          quizPassScore: quiz ? Number(quiz.passScore || 8) : null,
          totalLessons: module.lessons.length,
          completedLessons: lessons.filter(
            (lesson) => lesson.moduleId === module.id && lesson.isCompleted,
          ).length,
        };
      }),
      nextLessonId: nextLesson?.id || null,
      effectivePrice: effectivePrice(course),
      enrollmentLocked: course.enrollmentLocked,
      enrollmentLockedMessage: course.enrollmentLockedMessage,
    };
  }

  // -------------------------------------------------------------------------
  // Live sessions (calendar)
  // -------------------------------------------------------------------------

  async createSession(
    courseId: string,
    data: any,
    user: { sub: string; role: Role; permissions?: string[] },
  ) {
    await this.assertCanManage(courseId, user);
    if (!data.title || !data.startTime || !data.endTime) {
      throw new BadRequestException('Title, start time and end time are required');
    }
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Invalid session dates');
    }
    if (end <= start) {
      throw new BadRequestException('End time must be after the start time');
    }

    const session = await this.prisma.liveSession.create({
      data: {
        courseId,
        instructorId: user.sub,
        title: data.title,
        description: data.description,
        meetingUrl: data.meetingUrl,
        meetingId: data.meetingId,
        meetingPasscode: data.meetingPasscode,
        startTime: start,
        endTime: end,
        timezone: data.timezone || 'UTC',
        maxAttendees: data.maxAttendees ? parseInt(data.maxAttendees, 10) : 100,
        reminderMinutesBefore:
          data.reminderMinutesBefore !== undefined
            ? parseInt(data.reminderMinutesBefore, 10)
            : 30,
        isRecorded: data.isRecorded === true || data.isRecorded === 'true',
        recordingUrl: data.recordingUrl,
      },
      include: { course: { select: { id: true, title: true } } },
    });

    const enrolled = await this.prisma.enrollment.findMany({
      where: { courseId, status: EnrollmentStatus.ACTIVE },
      select: { userId: true },
    });
    await this.notifications.createMany(
      enrolled.map((row) => ({
        userId: row.userId,
        type: 'SESSION' as const,
        title: `Live class scheduled: ${session.title}`,
        body: `${start.toLocaleString()} · ${session.course.title}`,
        link: '/calendar',
      })),
    );

    return session;
  }

  async updateSession(
    sessionId: string,
    data: any,
    user: { sub: string; role: Role; permissions?: string[] },
  ) {
    const session = await this.prisma.liveSession.findUnique({
      where: { id: sessionId },
      select: { courseId: true },
    });
    if (!session) throw new NotFoundException('Session not found');
    await this.assertCanManage(session.courseId, user);

    return this.prisma.liveSession.update({
      where: { id: sessionId },
      data: {
        title: data.title,
        description: data.description,
        meetingUrl: data.meetingUrl,
        meetingId: data.meetingId,
        meetingPasscode: data.meetingPasscode,
        startTime: data.startTime ? new Date(data.startTime) : undefined,
        endTime: data.endTime ? new Date(data.endTime) : undefined,
        timezone: data.timezone,
        maxAttendees:
          data.maxAttendees === undefined
            ? undefined
            : parseInt(data.maxAttendees, 10),
        reminderMinutesBefore:
          data.reminderMinutesBefore === undefined
            ? undefined
            : parseInt(data.reminderMinutesBefore, 10),
        reminderSentAt: data.startTime ? null : undefined,
        isRecorded:
          data.isRecorded === undefined
            ? undefined
            : data.isRecorded === true || data.isRecorded === 'true',
        recordingUrl: data.recordingUrl,
        isCancelled:
          data.isCancelled === undefined
            ? undefined
            : data.isCancelled === true || data.isCancelled === 'true',
      },
    });
  }

  async deleteSession(
    sessionId: string,
    user: { sub: string; role: Role; permissions?: string[] },
  ) {
    const session = await this.prisma.liveSession.findUnique({
      where: { id: sessionId },
      select: { courseId: true },
    });
    if (!session) throw new NotFoundException('Session not found');
    await this.assertCanManage(session.courseId, user);
    await this.prisma.liveSession.delete({ where: { id: sessionId } });
    return { deleted: true };
  }

  async listSessions(
    courseId: string,
    user: { sub: string; role: Role; permissions?: string[] },
  ) {
    const course = await this.courseForManagement(courseId).catch(() => null);
    const canManage = course
      ? this.canManage(course, user.sub, user.role, user.permissions || [])
      : false;
    if (!canManage) {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: user.sub, courseId } },
        select: { id: true },
      });
      if (!enrollment) throw new ForbiddenException('You are not enrolled in this course');
    }

    return this.prisma.liveSession.findMany({
      where: { courseId },
      orderBy: { startTime: 'asc' },
      include: { instructor: { select: { firstName: true, lastName: true } } },
    });
  }

  // -------------------------------------------------------------------------
  // Misc
  // -------------------------------------------------------------------------

  async getCategories() {
    return this.prisma.category.findMany({
      where: { parentId: null },
      include: {
        _count: {
          select: { courses: { where: { isPublished: true } }, blogPosts: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async search(query: string, limit = 10) {
    return this.prisma.course.findMany({
      where: {
        isPublished: true,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      include: {
        instructor: { select: { firstName: true, lastName: true } },
        category: true,
      },
    });
  }

  private optionalInt(value: any): number | null {
    if (value === undefined || value === null || value === '') return null;
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private optionalDate(value: any): Date | null {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private generateSlug(title: string): string {
    return String(title || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+$/, '')
      .replace(/^-+/, '');
  }
}
