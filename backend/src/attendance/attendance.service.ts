import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { ActivityService } from '../activity/activity.service';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
  ) {}

  private normalizeDate(value?: string | Date) {
    if (!value) {
      const now = new Date();
      return new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
      );
    }
    if (value instanceof Date) {
      return new Date(
        Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
      );
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(`${value}T00:00:00.000Z`);
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('Invalid date');
    }
    return new Date(
      Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()),
    );
  }

  private async assertManager(courseId: string, user: any) {
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
      user?.role === Role.SUPERADMIN ||
      user?.role === Role.ADMIN ||
      course.instructorId === user?.sub ||
      course.instructors.some((row) => row.userId === user?.sub);

    if (!canManage) {
      throw new ForbiddenException(
        'You can only take attendance for courses assigned to you',
      );
    }
    return course;
  }

  private statistics(records: Array<{ isPresent: boolean; score: number | null }>) {
    const marked = records.length;
    const present = records.filter((row) => row.isPresent).length;
    const scores = records
      .map((row) => row.score)
      .filter((score): score is number => typeof score === 'number');
    return {
      marked,
      present,
      absent: marked - present,
      rate: marked ? Math.round((present / marked) * 100) : 0,
      averageScore: scores.length
        ? Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10) / 10
        : null,
    };
  }

  async forCourse(courseId: string, date: string | undefined, user: any) {
    const course = await this.assertManager(courseId, user);
    const day = this.normalizeDate(date);

    const [enrollments, records, allRecords] = await Promise.all([
      this.prisma.enrollment.findMany({
        where: {
          courseId,
          status: { in: ['ACTIVE', 'COMPLETED'] },
        },
        orderBy: { enrolledAt: 'asc' },
        select: {
          id: true,
          progress: true,
          status: true,
          enrolledAt: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
        },
      }),
      this.prisma.attendanceRecord.findMany({
        where: { courseId, date: day },
      }),
      this.prisma.attendanceRecord.findMany({
        where: { courseId },
        select: { studentId: true, isPresent: true, score: true, date: true },
        orderBy: { date: 'desc' },
      }),
    ]);

    const dayByStudent = new Map(records.map((row) => [row.studentId, row]));
    const statsByStudent = new Map<string, typeof allRecords>();
    allRecords.forEach((row) => {
      const list = statsByStudent.get(row.studentId) || [];
      list.push(row);
      statsByStudent.set(row.studentId, list);
    });

    const students = enrollments.map((enrollment) => {
      const studentRecords = statsByStudent.get(enrollment.user.id) || [];
      return {
        ...enrollment.user,
        progress: enrollment.progress,
        enrollmentStatus: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
        record: dayByStudent.get(enrollment.user.id) || null,
        stats: this.statistics(studentRecords),
      };
    });

    const summary = this.statistics(records);
    const dates = [...new Set(allRecords.map((row) => row.date.toISOString().slice(0, 10)))].sort(
      (a, b) => (a < b ? 1 : -1),
    );

    return {
      course,
      date: day.toISOString().slice(0, 10),
      students,
      summary: {
        ...summary,
        total: students.length,
        unmarked: Math.max(0, students.length - summary.marked),
        attendanceRate: students.length
          ? Math.round((summary.present / students.length) * 100)
          : 0,
      },
      historyDates: dates.slice(0, 30),
    };
  }

  async mark(
    input: {
      courseId: string;
      studentId: string;
      date?: string;
      isPresent?: boolean;
      score?: number | string | null;
      note?: string;
    },
    user: any,
  ) {
    if (!input.courseId || !input.studentId) {
      throw new BadRequestException('Course and student are required');
    }
    const course = await this.assertManager(input.courseId, user);
    const day = this.normalizeDate(input.date);

    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId: input.studentId, courseId: input.courseId },
      },
      select: { id: true, user: { select: { firstName: true, lastName: true } } },
    });
    if (!enrollment) {
      throw new BadRequestException('That student is not enrolled in this course');
    }

    let score: number | null | undefined;
    if (input.score === null || input.score === '') {
      score = null;
    } else if (input.score !== undefined) {
      const parsed = Number(input.score);
      if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
        throw new BadRequestException('Score must be between 0 and 100');
      }
      score = Math.round(parsed * 10) / 10;
    }

    const record = await this.prisma.attendanceRecord.upsert({
      where: {
        courseId_studentId_date: {
          courseId: input.courseId,
          studentId: input.studentId,
          date: day,
        },
      },
      create: {
        courseId: input.courseId,
        studentId: input.studentId,
        mentorId: user.sub,
        date: day,
        isPresent: input.isPresent === true,
        score: score ?? null,
        note: input.note || null,
      },
      update: {
        mentorId: user.sub,
        ...(input.isPresent === undefined ? {} : { isPresent: input.isPresent }),
        ...(score === undefined ? {} : { score }),
        ...(input.note === undefined ? {} : { note: input.note || null }),
      },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
    });

    const studentName = `${enrollment.user.firstName || ''} ${
      enrollment.user.lastName || ''
    }`.trim();
    this.activity.log({
      actor: user,
      action: 'attendance.marked',
      description: `${studentName || 'Student'} marked ${
        record.isPresent ? 'present' : 'absent'
      } for ${course.title}${record.score !== null ? ` · score ${record.score}` : ''}`,
      entityType: 'attendance',
      entityId: record.id,
      metadata: {
        courseId: input.courseId,
        studentId: input.studentId,
        date: day.toISOString().slice(0, 10),
        isPresent: record.isPresent,
        score: record.score,
      },
    });

    return record;
  }

  async markAll(
    input: {
      courseId: string;
      date?: string;
      studentIds?: string[];
      isPresent?: boolean;
    },
    user: any,
  ) {
    if (!input.courseId) throw new BadRequestException('Course is required');
    await this.assertManager(input.courseId, user);

    const students = input.studentIds?.length
      ? input.studentIds
      : (
          await this.prisma.enrollment.findMany({
            where: { courseId: input.courseId, status: { in: ['ACTIVE', 'COMPLETED'] } },
            select: { userId: true },
          })
        ).map((row) => row.userId);

    for (const studentId of students) {
      await this.mark(
        {
          courseId: input.courseId,
          studentId,
          date: input.date,
          isPresent: input.isPresent !== false,
        },
        user,
      );
    }

    return { updated: students.length };
  }

  async my(userId: string) {
    const records = await this.prisma.attendanceRecord.findMany({
      where: { studentId: userId },
      orderBy: { date: 'desc' },
      take: 120,
      include: {
        course: { select: { id: true, title: true, thumbnail: true, slug: true } },
      },
    });

    const byCourse = new Map<string, typeof records>();
    records.forEach((row) => {
      const list = byCourse.get(row.courseId) || [];
      list.push(row);
      byCourse.set(row.courseId, list);
    });

    const courses = [...byCourse.entries()].map(([courseId, list]) => ({
      courseId,
      course: list[0].course,
      ...this.statistics(list),
      records: list.slice(0, 12),
    }));

    const overall = this.statistics(records);
    return {
      records,
      courses,
      summary: {
        ...overall,
        sessions: records.length,
        attendanceRate: overall.rate,
      },
    };
  }
}
