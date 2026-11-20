import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/services/prisma.service';
import { EnrollmentStatus, Role } from '@prisma/client';
import { CertificatesService } from '../certificates/certificates.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../common/services/mail.service';

@Injectable()
export class EnrollmentsService {
  private readonly logger = new Logger(EnrollmentsService.name);

  constructor(
    private prisma: PrismaService,
    private certificates: CertificatesService,
    private notifications: NotificationsService,
    private mail: MailService,
    private config: ConfigService,
  ) {}

  async enroll(userId: string, courseId: string) {
    // Check if course exists and is published
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        type: true,
        price: true,
        isPublished: true,
        enrollmentLocked: true,
        enrollmentLockedMessage: true,
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (!course.isPublished) {
      throw new BadRequestException('Course is not published');
    }

    if (course.enrollmentLocked) {
      throw new BadRequestException(
        course.enrollmentLockedMessage ||
          'Enrolment for this course is temporarily closed. Please check back later.',
      );
    }

    // Check if already enrolled
    const existing = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId, courseId },
      },
    });

    if (existing) {
      throw new BadRequestException('Already enrolled in this course');
    }

    // Free courses auto-enroll, paid courses create pending payment
    if (course.type === 'FREE') {
      const enrollment = await this.prisma.enrollment.create({
        data: {
          userId,
          courseId,
          status: EnrollmentStatus.ACTIVE,
        },
        include: { course: true },
      });

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, email: true },
      });
      if (user) {
        await this.notifications.create({
          userId,
          type: 'SYSTEM',
          title: `Welcome to ${course.title}`,
          body: 'Your free course is ready. Start with the first lesson whenever you like.',
          link: `/courses/${courseId}`,
        });
        await this.mail.sendTemplate('enrollment', user.email, {
          firstName: user.firstName,
          courseTitle: course.title,
          url: `${
            this.config.get('FRONTEND_URL') || 'http://localhost:3000'
          }/courses/${courseId}`,
        });
      }

      return enrollment;
    }

    return {
      course,
      requiresPayment: true,
      message: 'This course requires payment before enrollment',
    };
  }

  async findMyEnrollments(userId: string, params: { page?: number; limit?: number }) {
    const page = params.page || 1;
    const limit = Math.min(params.limit || 10, 100);
    const skip = (page - 1) * limit;

    const [enrollments, total] = await this.prisma.$transaction([
      this.prisma.enrollment.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { lastAccessedAt: 'desc' },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              type: true,
              thumbnail: true,
              instructor: {
                select: { firstName: true, lastName: true },
              },
            },
          },
          certificate: true,
          _count: { select: { lessons: true } },
        },
      }),
      this.prisma.enrollment.count({ where: { userId } }),
    ]);

    return {
      enrollments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, userId: string, userRole: Role) {
    const isStaff =
      userRole === Role.SUPERADMIN ||
      userRole === Role.ADMIN ||
      userRole === Role.STAFF;

    const enrollment = await this.prisma.enrollment.findFirst({
      where: isStaff ? { id } : { id, userId },
      include: {
        course: {
          include: {
            modules: {
              orderBy: { order: 'asc' },
              include: {
                lessons: {
                  orderBy: { order: 'asc' },
                  include: {
                    progress: {
                      where: { enrollmentId: id },
                    },
                  },
                },
              },
            },
          },
        },
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        certificate: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    return enrollment;
  }

  async updateProgress(
    enrollmentId: string,
    lessonId: string,
    progress: number,
    userId: string,
  ) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      select: {
        id: true,
        userId: true,
        courseId: true,
        enrolledAt: true,
        status: true,
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    if (enrollment.userId !== userId) {
      throw new ForbiddenException('This enrollment belongs to another student');
    }

    if (enrollment.status === EnrollmentStatus.COMPLETED) {
      throw new BadRequestException(
        'This course is complete. Lessons are closed for review only.',
      );
    }

    await this.assertLessonUnlocked(enrollment, lessonId);

    const bounded = Math.max(0, Math.min(100, Number(progress) || 0));

    const lessonProgress = await this.prisma.lessonProgress.upsert({
      where: {
        enrollmentId_lessonId: { enrollmentId, lessonId },
      },
      update: {
        progress: bounded,
        isCompleted: bounded >= 100,
        watchedAt: new Date(),
      },
      create: {
        enrollmentId,
        lessonId,
        userId,
        progress: bounded,
        isCompleted: bounded >= 100,
        watchedAt: new Date(),
      },
    });

    // Recalculate overall progress
    await this.recalculateEnrollmentProgress(enrollmentId);

    return lessonProgress;
  }

  async recordAttendance(
    enrollmentId: string,
    sessionId: string,
    userId: string,
  ) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      select: { id: true, userId: true },
    });

    if (!enrollment || enrollment.userId !== userId) {
      throw new NotFoundException('Enrollment not found');
    }

    return this.prisma.liveSessionAttendance.upsert({
      where: {
        sessionId_userId: { sessionId, userId },
      },
      update: {
        joinedAt: new Date(),
        isPresent: true,
      },
      create: {
        sessionId,
        userId,
        joinedAt: new Date(),
        isPresent: true,
      },
    });
  }

  private async assertCourseManager(
    courseId: string,
    user: { sub: string; role: Role },
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        instructorId: true,
        instructors: { select: { userId: true } },
      },
    });
    if (!course) throw new NotFoundException('Course not found');
    const canManage =
      user.role === Role.SUPERADMIN ||
      user.role === Role.ADMIN ||
      course.instructorId === user.sub ||
      course.instructors.some((row) => row.userId === user.sub);
    if (!canManage) {
      throw new ForbiddenException('You only manage courses assigned to you');
    }
    return course;
  }

  async findCourseEnrollments(courseId: string, user: { sub: string; role: Role }) {
    await this.assertCourseManager(courseId, user);
    return this.prisma.enrollment.findMany({
      where: { courseId },
      orderBy: { enrolledAt: 'desc' },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
      },
    });
  }

  async removeEnrollment(id: string, user: { sub: string; role: Role }) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
      select: { id: true, courseId: true, userId: true },
    });
    if (!enrollment) throw new NotFoundException('Enrolment not found');
    await this.assertCourseManager(enrollment.courseId, user);

    await this.prisma.$transaction([
      this.prisma.certificate.deleteMany({ where: { enrollmentId: id } }),
      this.prisma.payment.updateMany({
        where: { enrollmentId: id },
        data: { enrollmentId: null },
      }),
      this.prisma.lessonProgress.deleteMany({ where: { enrollmentId: id } }),
      this.prisma.enrollment.delete({ where: { id } }),
    ]);

    await this.notifications
      .create({
        userId: enrollment.userId,
        type: 'ACCOUNT' as any,
        title: 'Removed from a course',
        body: 'You were removed from a course by your instructor.',
      })
      .catch(() => undefined);

    return { removed: true };
  }

  async getEnrollmentStats(courseId: string, userId: string, userRole: Role) {
    const where: any = { courseId };
    if (userRole !== Role.SUPERADMIN && userRole !== Role.ADMIN) {
      where.userId = userId;
    }

    const total = await this.prisma.enrollment.count({ where });
    const active = await this.prisma.enrollment.count({
      where: { ...where, status: EnrollmentStatus.ACTIVE },
    });
    const completed = await this.prisma.enrollment.count({
      where: { ...where, status: EnrollmentStatus.COMPLETED },
    });

    return { total, active, completed };
  }

  private async recalculateEnrollmentProgress(enrollmentId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        lessons: {
          include: {
            lesson: true,
          },
        },
        course: {
          select: {
            type: true,
            title: true,
            modules: {
              where: { isPublished: true },
              include: {
                lessons: { where: { isPublished: true } },
              },
            },
          },
        },
      },
    });

    if (!enrollment) return;

    const allLessons = enrollment.course.modules.flatMap((m) => m.lessons);
    const totalLessons = allLessons.length;
    if (totalLessons === 0) return;

    const completedLessons = enrollment.lessons.filter((l) => l.isCompleted).length;
    const progress = Number(((completedLessons / totalLessons) * 100).toFixed(2));
    const isComplete = progress >= 100;

    const wasComplete = enrollment.status === EnrollmentStatus.COMPLETED;

    await this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        progress,
        status: isComplete ? EnrollmentStatus.COMPLETED : EnrollmentStatus.ACTIVE,
        completedAt: isComplete ? enrollment.completedAt || new Date() : null,
      },
    });

    if (isComplete && !wasComplete) {
      await this.notifications.create({
        userId: enrollment.userId,
        type: 'CERTIFICATE',
        title: `You completed ${enrollment.course.title}!`,
        body:
          enrollment.course.type === 'FREE'
            ? 'Great work — your completed course is now on your dashboard.'
            : 'Your certificate is being prepared if your payment is approved.',
        link: '/dashboard',
      });

      try {
        await this.certificates.ensureForEnrollment(enrollmentId);
      } catch (error) {
        this.logger.warn(
          `Certificate issue failed for enrollment ${enrollmentId}: ${
            error instanceof Error ? error.message : error
          }`,
        );
      }
    }
  }

  /**
   * A lesson unlocks at the later of:
   *  - enrolment date + module.unlockAfterDays + lesson.unlockAfterDays
   *  - module.unlockAt / lesson.unlockAt (absolute dates)
   */
  private async assertLessonUnlocked(
    enrollment: { id: string; courseId: string; enrolledAt: Date },
    lessonId: string,
  ) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          select: {
            courseId: true,
            unlockAfterDays: true,
            unlockAt: true,
          },
        },
      },
    });

    if (!lesson || lesson.module.courseId !== enrollment.courseId) {
      throw new NotFoundException('Lesson not found in this course');
    }

    if (lesson.isFree) return;

    const dayMs = 24 * 60 * 60 * 1000;
    const relativeDays =
      (lesson.module.unlockAfterDays || 0) + (lesson.unlockAfterDays || 0);
    let unlockTime = new Date(enrollment.enrolledAt).getTime() + relativeDays * dayMs;

    const absoluteDates = [lesson.unlockAt, lesson.module.unlockAt]
      .filter(Boolean)
      .map((value) => new Date(value as Date).getTime());
    for (const date of absoluteDates) {
      unlockTime = Math.max(unlockTime, date);
    }

    if (Date.now() < unlockTime) {
      throw new BadRequestException({
        message: `This lesson is scheduled and unlocks on ${new Date(
          unlockTime,
        ).toLocaleString()}.`,
        code: 'LESSON_LOCKED',
      });
    }
  }

  async markCompleted(enrollmentId: string, userId: string, userRole: Role) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      select: { userId: true, id: true, course: { select: { title: true } } },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    if (userRole !== Role.SUPERADMIN && userRole !== Role.ADMIN && enrollment.userId !== userId) {
      throw new BadRequestException('Access denied');
    }

    const updated = await this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status: EnrollmentStatus.COMPLETED,
        progress: 100,
        completedAt: new Date(),
      },
    });

    try {
      await this.certificates.ensureForEnrollment(enrollmentId);
    } catch (error) {
      this.logger.warn(
        `Certificate issue failed: ${
          error instanceof Error ? error.message : error
        }`,
      );
    }

    await this.notifications.create({
      userId: enrollment.userId,
      type: 'CERTIFICATE',
      title: `You completed ${enrollment.course?.title || 'your course'}!`,
      body: 'Check your dashboard for your certificate.',
      link: '/dashboard',
    });

    return updated;
  }
}
