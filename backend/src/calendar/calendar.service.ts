import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { EnrollmentStatus, Role } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { MailService } from '../common/services/mail.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CalendarService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CalendarService.name);
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly notifications: NotificationsService,
  ) {}

  onModuleInit() {
    // Lightweight in-process reminder worker. It does not require Redis or a
    // queue and is safe to run on a single API instance.
    this.timer = setInterval(() => {
      this.sendDueReminders().catch((error) =>
        this.logger.warn(
          `Reminder sweep failed: ${
            error instanceof Error ? error.message : error
          }`,
        ),
      );
    }, 60_000);
    this.timer.unref?.();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async myCalendar(user: { sub: string; role: Role }) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId: user.sub },
      select: {
        courseId: true,
        enrolledAt: true,
        course: { select: { id: true, title: true, thumbnail: true } },
      },
    });

    const courseIds = enrollments.map((row) => row.courseId);
    if (courseIds.length === 0) {
      return { events: [], courses: [], upcoming: [] };
    }

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [sessions, assignments] = await Promise.all([
      this.prisma.liveSession.findMany({
        where: {
          courseId: { in: courseIds },
          isCancelled: false,
          startTime: { gte: since },
        },
        orderBy: { startTime: 'asc' },
        include: {
          course: { select: { id: true, title: true } },
          instructor: { select: { firstName: true, lastName: true } },
        },
      }),
      this.prisma.assignment.findMany({
        where: {
          courseId: { in: courseIds },
          isPublished: true,
          dueAt: { gte: since },
        },
        orderBy: { dueAt: 'asc' },
        include: { course: { select: { id: true, title: true } } },
      }),
    ]);

    const events = [
      ...sessions.map((session) => ({
        id: `session-${session.id}`,
        entityId: session.id,
        type: 'SESSION',
        title: session.title,
        description: session.description,
        start: session.startTime,
        end: session.endTime,
        allDay: false,
        course: session.course,
        instructor: session.instructor,
        meetingUrl: session.meetingUrl,
        location: session.meetingUrl ? 'Online' : null,
        url: session.meetingUrl || '/calendar',
      })),
      ...assignments
        .filter((assignment) => assignment.dueAt)
        .map((assignment) => ({
          id: `assignment-${assignment.id}`,
          entityId: assignment.id,
          type: 'ASSIGNMENT',
          title: `Due: ${assignment.title}`,
          description: assignment.description,
          start: assignment.dueAt,
          end: assignment.dueAt,
          allDay: true,
          course: assignment.course,
          url: `/assignments`,
        })),
    ].sort((a, b) => new Date(a.start as any).getTime() - new Date(b.start as any).getTime());

    const now = Date.now();
    const upcoming = events
      .filter((event) => new Date(event.start as any).getTime() >= now)
      .slice(0, 8);

    return {
      events,
      upcoming,
      courses: enrollments.map((row) => row.course),
    };
  }

  async courseCalendar(courseId: string, user: { sub: string; role: Role; permissions?: string[] }) {
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
      const enrollment = await this.prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: user.sub, courseId } },
      });
      if (!enrollment) throw new NotFoundException('Course not found');
    }

    return this.prisma.liveSession.findMany({
      where: { courseId, isCancelled: false },
      orderBy: { startTime: 'asc' },
      include: { instructor: { select: { firstName: true, lastName: true } } },
    });
  }

  async sendDueReminders() {
    const now = Date.now();
    const horizon = new Date(now + 24 * 60 * 60 * 1000);

    const sessions = await this.prisma.liveSession.findMany({
      where: {
        isCancelled: false,
        reminderSentAt: null,
        startTime: { gte: new Date(now), lte: horizon },
      },
      include: { course: { select: { id: true, title: true } } },
    });

    for (const session of sessions) {
      const reminderAt =
        new Date(session.startTime).getTime() -
        (session.reminderMinutesBefore || 30) * 60_000;
      if (now < reminderAt) continue;

      const enrollments = await this.prisma.enrollment.findMany({
        where: { courseId: session.courseId, status: EnrollmentStatus.ACTIVE },
        include: { user: { select: { id: true, firstName: true, email: true } } },
      });

      const minutes = Math.max(
        1,
        Math.round((new Date(session.startTime).getTime() - now) / 60_000),
      );

      for (const enrollment of enrollments) {
        await this.notifications.create({
          userId: enrollment.userId,
          type: 'SESSION',
          title: `Starting soon: ${session.title}`,
          body: `${session.course.title} · ${new Date(
            session.startTime,
          ).toLocaleString()}`,
          link: '/calendar',
        });
        await this.mail.sendTemplate('session-reminder', enrollment.user.email, {
          firstName: enrollment.user.firstName,
          sessionTitle: session.title,
          courseTitle: session.course.title,
          startTime: new Date(session.startTime).toLocaleString(),
          minutes,
          joinUrl: session.meetingUrl,
        });
      }

      await this.prisma.liveSession.update({
        where: { id: session.id },
        data: { reminderSentAt: new Date() },
      });
      this.logger.log(
        `Sent reminders for session ${session.id} to ${enrollments.length} students`,
      );
    }
  }
}
