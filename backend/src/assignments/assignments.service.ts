import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  AssignmentStatus,
  QuizQuestionType,
  Role,
} from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { MailService } from '../common/services/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeService } from '../realtime/realtime.service';
import { CertificatesService } from '../certificates/certificates.service';

const MANAGER_PERMISSIONS = ['MANAGE_COURSES', 'GRADE_ASSIGNMENTS'];

interface QuestionInput {
  prompt: string;
  type?: QuizQuestionType | string;
  points?: number;
  order?: number;
  explanation?: string;
  options?: Array<{ text: string; isCorrect?: boolean } | string>;
}

@Injectable()
export class AssignmentsService {
  private readonly logger = new Logger(AssignmentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly notifications: NotificationsService,
    private readonly realtime: RealtimeService,
    private readonly certificates: CertificatesService,
  ) {}

  // -------------------------------------------------------------------------
  // Access
  // -------------------------------------------------------------------------

  private async assertCourseAccess(courseId: string, user: any) {
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

    // Admins can manage every course; staff only the courses assigned to them.
    const canManage =
      user.role === Role.SUPERADMIN ||
      user.role === Role.ADMIN ||
      course.instructorId === user.sub ||
      course.instructors.some((row) => row.userId === user.sub);

    if (!canManage) throw new ForbiddenException('You only manage courses assigned to you');
    return course;
  }

  private async assertEnrolled(courseId: string, userId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment) {
      throw new ForbiddenException('You are not enrolled in this course');
    }
    return enrollment;
  }

  // -------------------------------------------------------------------------
  // Assignment CRUD
  // -------------------------------------------------------------------------

  async create(courseId: string, data: any, user: any) {
    await this.assertCourseAccess(courseId, user);

    const type = String(data.type || 'TEXT').toUpperCase();
    const assignment = await this.prisma.assignment.create({
      data: {
        courseId,
        moduleId: data.moduleId || null,
        title: data.title,
        description: data.description,
        instructions: data.instructions,
        type,
        dueAt: data.dueAt ? new Date(data.dueAt) : null,
        maxScore: data.maxScore ? parseFloat(data.maxScore) : 100,
        passScore: data.passScore ? parseFloat(data.passScore) : null,
        autoGrade: type === 'QUIZ' ? true : data.autoGrade === true,
        isPublished:
          data.isPublished === undefined
            ? true
            : data.isPublished === true || data.isPublished === 'true',
        createdById: user.sub,
      },
    });

    if (type === 'QUIZ' && Array.isArray(data.questions) && data.questions.length) {
      return this.replaceQuestions(assignment.id, data.questions, user);
    }

    return assignment;
  }

  async createBulk(courseId: string, items: any[], user: any) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException('Send an array of assignments to create');
    }
    await this.assertCourseAccess(courseId, user);

    const created: any[] = [];
    const errors: Array<{ index: number; title?: string; message: string }> = [];

    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      if (!item?.title) {
        errors.push({ index, message: 'Title is required' });
        continue;
      }
      try {
        created.push(await this.create(courseId, item, user));
      } catch (error) {
        errors.push({
          index,
          title: item.title,
          message: error instanceof Error ? error.message : 'Could not create',
        });
      }
    }

    return { created, errors, count: created.length };
  }

  async update(id: string, data: any, user: any) {
    const assignment = await this.prisma.assignment.findUnique({ where: { id } });
    if (!assignment) throw new NotFoundException('Assignment not found');
    await this.assertCourseAccess(assignment.courseId, user);

    const type = data.type ? String(data.type).toUpperCase() : undefined;
    const updated = await this.prisma.assignment.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        instructions: data.instructions,
        type,
        dueAt:
          data.dueAt === undefined
            ? undefined
            : data.dueAt
            ? new Date(data.dueAt)
            : null,
        maxScore:
          data.maxScore === undefined ? undefined : parseFloat(data.maxScore),
        passScore:
          data.passScore === undefined
            ? undefined
            : data.passScore
            ? parseFloat(data.passScore)
            : null,
        autoGrade:
          type === 'QUIZ'
            ? true
            : data.autoGrade === undefined
            ? undefined
            : data.autoGrade === true,
        isPublished:
          data.isPublished === undefined
            ? undefined
            : data.isPublished === true || data.isPublished === 'true',
        moduleId:
          data.moduleId === undefined ? undefined : data.moduleId || null,
      },
    });

    if (Array.isArray(data.questions)) {
      return this.replaceQuestions(id, data.questions, user);
    }
    return updated;
  }

  async remove(id: string, user: any) {
    const assignment = await this.prisma.assignment.findUnique({ where: { id } });
    if (!assignment) throw new NotFoundException('Assignment not found');
    await this.assertCourseAccess(assignment.courseId, user);
    await this.prisma.assignment.delete({ where: { id } });
    return { deleted: true };
  }

  async byCourse(courseId: string, user: any) {
    const isStudent = user.role === Role.STUDENT;

    if (isStudent) {
      await this.assertEnrolled(courseId, user.sub);
    } else {
      await this.assertCourseAccess(courseId, user);
    }

    const assignments = await this.prisma.assignment.findMany({
      where: { courseId, ...(isStudent ? { isPublished: true } : {}) },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: { select: { submissions: true, questions: true } },
        submissions: isStudent
          ? { where: { userId: user.sub } }
          : {
              include: {
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
            },
        questions: isStudent
          ? {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                prompt: true,
                type: true,
                points: true,
                order: true,
                options: {
                  orderBy: { order: 'asc' },
                  select: { id: true, text: true, order: true },
                },
              },
            }
          : {
              orderBy: { order: 'asc' },
              include: { options: { orderBy: { order: 'asc' } } },
            },
      },
    });

    if (isStudent) {
      return assignments.map((assignment) => ({
        ...assignment,
        submission: assignment.submissions[0] || null,
      }));
    }
    return assignments;
  }

  async myAssignments(userId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      select: { courseId: true },
    });
    const courseIds = enrollments.map((e) => e.courseId);
    if (courseIds.length === 0) return [];

    const [assignments, modules, quizzes, submissions, progress] = await Promise.all([
      this.prisma.assignment.findMany({
        where: { courseId: { in: courseIds }, isPublished: true },
        orderBy: [{ dueAt: 'asc' }, { createdAt: 'desc' }],
        include: {
          course: { select: { id: true, title: true, thumbnail: true } },
          module: { select: { id: true, title: true, order: true } },
          submissions: { where: { userId } },
          _count: { select: { questions: true } },
        },
      }),
      this.prisma.module.findMany({
        where: { courseId: { in: courseIds }, isPublished: true },
        orderBy: { order: 'asc' },
        select: {
          id: true,
          courseId: true,
          order: true,
          lessons: { where: { isPublished: true }, select: { id: true } },
        },
      }),
      this.prisma.assignment.findMany({
        where: {
          courseId: { in: courseIds },
          type: 'QUIZ',
          isPublished: true,
          moduleId: { not: null },
        },
        select: { id: true, courseId: true, moduleId: true, passScore: true },
      }),
      this.prisma.assignmentSubmission.findMany({
        where: {
          userId,
          assignmentId: {
            in: (await this.prisma.assignment.findMany({
              where: { courseId: { in: courseIds }, type: 'QUIZ', isPublished: true },
              select: { id: true },
            })).map((row) => row.id),
          },
        },
        select: { assignmentId: true, score: true },
      }),
      this.prisma.lessonProgress.findMany({
        where: { userId, isCompleted: true },
        select: { lessonId: true },
      }),
    ]);

    const completedLessons = new Set(progress.map((row) => row.lessonId));
    const quizByModule = new Map(
      quizzes
        .filter((quiz) => quiz.moduleId)
        .map((quiz) => [quiz.moduleId as string, quiz]),
    );
    const submissionByQuiz = new Map(
      submissions.map((row) => [row.assignmentId, row]),
    );

    return assignments.map((a) => {
      let locked = false;
      let lockReason: string | null = null;

      if (a.type === 'QUIZ' && a.moduleId) {
        const currentModule = modules.find((module) => module.id === a.moduleId);
        const previousModule = currentModule
          ? modules.find(
              (module) =>
                module.courseId === a.courseId && module.order === currentModule.order - 1,
            )
          : undefined;

        if (previousModule) {
          const previousQuiz = quizByModule.get(previousModule.id);
          const previousSubmission = previousQuiz
            ? submissionByQuiz.get(previousQuiz.id)
            : undefined;
          const quizPassed =
            previousQuiz &&
            previousSubmission &&
            typeof previousSubmission.score === 'number' &&
            previousSubmission.score >= Number(previousQuiz.passScore || 6);
          const allLessonsDone =
            previousModule.lessons.length > 0 &&
            previousModule.lessons.every((lesson) => completedLessons.has(lesson.id));

          locked = previousQuiz ? !(quizPassed && allLessonsDone) : !allLessonsDone;
          lockReason = locked
            ? `Complete all lessons in ${previousModule.order - 1 > 0 ? 'the previous module' : 'the course'}${previousQuiz ? ' and pass its quiz' : ''} to unlock this quiz.`
            : null;
        }
      }

      return {
        ...a,
        submission: a.submissions[0] || null,
        locked,
        lockReason,
      };
    });
  }

  async findById(id: string, user: any) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, title: true, instructorId: true } },
        module: { select: { id: true, title: true } },
        questions: {
          orderBy: { order: 'asc' },
          include: { options: { orderBy: { order: 'asc' } } },
        },
      },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');

    if (user.role === Role.STUDENT) {
      await this.assertEnrolled(assignment.courseId, user.sub);
      return {
        ...assignment,
        questions: assignment.questions.map((question) => ({
          ...question,
          options: question.options.map((option) => ({
            id: option.id,
            text: option.text,
            order: option.order,
          })),
        })),
      };
    }

    await this.assertCourseAccess(assignment.courseId, user);
    return assignment;
  }

  // -------------------------------------------------------------------------
  // Quiz questions
  // -------------------------------------------------------------------------

  async getQuiz(assignmentId: string, user: any) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        course: { select: { id: true, title: true } },
        questions: {
          orderBy: { order: 'asc' },
          include: { options: { orderBy: { order: 'asc' } } },
        },
      },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');
    if (assignment.type !== 'QUIZ') {
      throw new BadRequestException('This assignment is not a quiz');
    }

    const isStudent = user.role === Role.STUDENT;
    if (isStudent) {
      await this.assertEnrolled(assignment.courseId, user.sub);
    } else {
      await this.assertCourseAccess(assignment.courseId, user);
    }

    const submission = await this.prisma.assignmentSubmission.findUnique({
      where: { assignmentId_userId: { assignmentId, userId: user.sub } },
    });

    return {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      instructions: assignment.instructions,
      dueAt: assignment.dueAt,
      maxScore: assignment.maxScore,
      passScore: assignment.passScore,
      course: assignment.course,
      questions: assignment.questions.map((question) => ({
        id: question.id,
        prompt: question.prompt,
        type: question.type,
        points: question.points,
        order: question.order,
        options: question.options.map((option) => ({
          id: option.id,
          text: option.text,
          order: option.order,
          ...(isStudent ? {} : { isCorrect: option.isCorrect }),
        })),
        ...(isStudent ? {} : { explanation: question.explanation }),
      })),
      submission,
      result: submission?.quizResult ? safeJson(submission.quizResult) : null,
    };
  }

  /** Accepts a single question object or `{ questions: [...] }`. */
  async addQuestions(assignmentId: string, payload: any, user: any) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');
    await this.assertCourseAccess(assignment.courseId, user);

    const inputs: QuestionInput[] = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.questions)
      ? payload.questions
      : [payload];

    if (assignment.type !== 'QUIZ') {
      await this.prisma.assignment.update({
        where: { id: assignmentId },
        data: { type: 'QUIZ', autoGrade: true },
      });
    }

    return this.createQuestionRows(assignmentId, inputs);
  }

  async replaceQuestions(assignmentId: string, payload: any, user: any) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');
    await this.assertCourseAccess(assignment.courseId, user);

    const inputs: QuestionInput[] = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.questions)
      ? payload.questions
      : [];

    await this.prisma.quizQuestion.deleteMany({ where: { assignmentId } });
    return this.createQuestionRows(assignmentId, inputs, true);
  }

  async updateQuestion(questionId: string, data: any, user: any) {
    const question = await this.prisma.quizQuestion.findUnique({
      where: { id: questionId },
      include: { assignment: { select: { courseId: true } } },
    });
    if (!question) throw new NotFoundException('Question not found');
    await this.assertCourseAccess(question.assignment.courseId, user);

    const updated = await this.prisma.quizQuestion.update({
      where: { id: questionId },
      data: {
        prompt: data.prompt,
        type: data.type,
        points: data.points === undefined ? undefined : Number(data.points),
        order: data.order === undefined ? undefined : Number(data.order),
        explanation: data.explanation,
      },
    });

    if (Array.isArray(data.options)) {
      await this.prisma.quizOption.deleteMany({ where: { questionId } });
      await this.prisma.quizOption.createMany({
        data: data.options.map((option: any, index: number) => ({
          questionId,
          text: String(option.text || option).trim(),
          isCorrect: option.isCorrect === true,
          order: index + 1,
        })),
      });
    }

    return this.prisma.quizQuestion.findUnique({
      where: { id: updated.id },
      include: { options: { orderBy: { order: 'asc' } } },
    });
  }

  async deleteQuestion(questionId: string, user: any) {
    const question = await this.prisma.quizQuestion.findUnique({
      where: { id: questionId },
      include: { assignment: { select: { courseId: true } } },
    });
    if (!question) throw new NotFoundException('Question not found');
    await this.assertCourseAccess(question.assignment.courseId, user);
    await this.prisma.quizQuestion.delete({ where: { id: questionId } });
    return { deleted: true };
  }

  private async createQuestionRows(
    assignmentId: string,
    inputs: QuestionInput[],
    replaceMaxScore = false,
  ) {
    if (!inputs.length) {
      throw new BadRequestException('Add at least one question');
    }

    const normalized = inputs.map((input, index) => {
      const prompt = String(input.prompt || '').trim();
      if (!prompt) throw new BadRequestException(`Question ${index + 1} needs a prompt`);

      const type = String(input.type || 'SINGLE_CHOICE').toUpperCase() as QuizQuestionType;
      let options = (input.options || []).map((option) =>
        typeof option === 'string'
          ? { text: option.trim(), isCorrect: false }
          : { text: String(option.text || '').trim(), isCorrect: option.isCorrect === true },
      );

      if (type === 'TRUE_FALSE' && options.length === 0) {
        options = [
          { text: 'True', isCorrect: false },
          { text: 'False', isCorrect: false },
        ];
      }

      if (type === 'SHORT_ANSWER') {
        if (options.length === 0) {
          throw new BadRequestException(
            `Question ${index + 1}: add at least one accepted answer`,
          );
        }
        options = options.map((option) => ({ ...option, isCorrect: true }));
      } else if (options.length < 2) {
        throw new BadRequestException(
          `Question ${index + 1}: add at least two answer options`,
        );
      }

      const correct = options.filter((option) => option.isCorrect).length;
      if (type === 'MULTIPLE_CHOICE' && correct < 1) {
        throw new BadRequestException(
          `Question ${index + 1}: mark at least one correct option`,
        );
      }
      if (type === 'SINGLE_CHOICE' && correct !== 1) {
        throw new BadRequestException(
          `Question ${index + 1}: mark exactly one correct option`,
        );
      }
      if (type === 'TRUE_FALSE' && correct !== 1) {
        throw new BadRequestException(
          `Question ${index + 1}: mark the correct True/False answer`,
        );
      }

      return {
        prompt,
        type,
        points: Number(input.points) > 0 ? Number(input.points) : 1,
        order: input.order !== undefined ? Number(input.order) : index + 1,
        explanation: input.explanation,
        options,
      };
    });

    const created: any[] = [];
    for (const question of normalized) {
      created.push(
        await this.prisma.quizQuestion.create({
          data: {
            assignmentId,
            prompt: question.prompt,
            type: question.type,
            points: question.points,
            order: question.order,
            explanation: question.explanation,
            options: { create: question.options.map((option, i) => ({ ...option, order: i + 1 })) },
          },
          include: { options: { orderBy: { order: 'asc' } } },
        }),
      );
    }

    const totalPoints = await this.prisma.quizQuestion.aggregate({
      where: { assignmentId },
      _sum: { points: true },
    });

    await this.prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        type: 'QUIZ',
        autoGrade: true,
        maxScore: totalPoints._sum.points || 100,
      },
    });

    return {
      questions: created,
      totalPoints: totalPoints._sum.points || 0,
      count: created.length,
    };
  }

  // -------------------------------------------------------------------------
  // Submission & grading
  // -------------------------------------------------------------------------

  async submit(assignmentId: string, userId: string, data: any) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
    });
    if (!assignment || !assignment.isPublished) {
      throw new NotFoundException('Assignment not found');
    }
    if (assignment.type === 'QUIZ') {
      return this.submitQuiz(assignmentId, userId, data.answers || data);
    }

    await this.assertEnrolled(assignment.courseId, userId);

    if (!data.content && !data.fileUrl) {
      throw new BadRequestException('Add your answer or upload a file before submitting');
    }

    const isLate = assignment.dueAt ? new Date() > assignment.dueAt : false;

    const submission = await this.prisma.assignmentSubmission.upsert({
      where: { assignmentId_userId: { assignmentId, userId } },
      update: {
        content: data.content,
        fileUrl: data.fileUrl,
        status: isLate ? AssignmentStatus.LATE : AssignmentStatus.SUBMITTED,
        submittedAt: new Date(),
        attemptCount: { increment: 1 },
      },
      create: {
        assignmentId,
        userId,
        content: data.content,
        fileUrl: data.fileUrl,
        status: isLate ? AssignmentStatus.LATE : AssignmentStatus.SUBMITTED,
      },
    });
    await this.realtime.trigger('private-admin', 'assignment:submitted', {
      assignmentId,
      submissionId: submission.id,
      userId,
    });
    return submission;
  }

  async submitQuiz(assignmentId: string, userId: string, answers: any) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        course: { select: { title: true } },
        questions: { include: { options: { orderBy: { order: 'asc' } } } },
      },
    });
    if (!assignment || !assignment.isPublished) {
      throw new NotFoundException('Assignment not found');
    }
    if (assignment.type !== 'QUIZ') {
      throw new BadRequestException('This assignment is not a quiz');
    }
    if (assignment.questions.length === 0) {
      throw new BadRequestException('This quiz has no questions yet');
    }

    await this.assertEnrolled(assignment.courseId, userId);

    const answerMap: Record<string, any> =
      answers && typeof answers === 'object' && !Array.isArray(answers)
        ? answers
        : {};

    let earnedPoints = 0;
    const breakdown = assignment.questions.map((question) => {
      const raw = answerMap[question.id];
      const correctOptions = question.options.filter((option) => option.isCorrect);
      const correctIds = correctOptions.map((option) => option.id);

      let isCorrect = false;
      let selected: any = raw;

      if (question.type === 'MULTIPLE_CHOICE') {
        const selectedIds = Array.isArray(raw)
          ? raw.map(String)
          : raw
          ? [String(raw)]
          : [];
        isCorrect =
          selectedIds.length === correctIds.length &&
          correctIds.every((id) => selectedIds.includes(id));
        selected = selectedIds;
      } else if (question.type === 'SHORT_ANSWER') {
        const text = normalizeText(raw);
        isCorrect =
          text.length > 0 &&
          correctOptions.some((option) => normalizeText(option.text) === text);
        selected = raw || '';
      } else {
        isCorrect = raw ? correctIds.includes(String(raw)) : false;
        selected = raw || '';
      }

      if (isCorrect) earnedPoints += Number(question.points);

      return {
        questionId: question.id,
        prompt: question.prompt,
        type: question.type,
        points: Number(question.points),
        earned: isCorrect ? Number(question.points) : 0,
        isCorrect,
        selected,
        correctOptionIds: correctIds,
        correctAnswers: correctOptions.map((option) => option.text),
        explanation: question.explanation || null,
      };
    });

    const totalPoints = assignment.questions.reduce(
      (sum, question) => sum + Number(question.points),
      0,
    );
    const percentage = totalPoints > 0 ? earnedPoints / totalPoints : 0;
    const score = Number((percentage * Number(assignment.maxScore)).toFixed(2));
    const isLate = assignment.dueAt ? new Date() > assignment.dueAt : false;

    const submission = await this.prisma.assignmentSubmission.upsert({
      where: { assignmentId_userId: { assignmentId, userId } },
      update: {
        answers: JSON.stringify(answerMap),
        quizResult: JSON.stringify({
          earnedPoints,
          totalPoints,
          percentage: Math.round(percentage * 100),
          breakdown,
        }),
        score,
        autoGraded: true,
        status: AssignmentStatus.GRADED,
        submittedAt: new Date(),
        gradedAt: new Date(),
        feedback: `Auto-graded: ${earnedPoints}/${totalPoints} points (${Math.round(
          percentage * 100,
        )}%).`,
        attemptCount: { increment: 1 },
      },
      create: {
        assignmentId,
        userId,
        answers: JSON.stringify(answerMap),
        quizResult: JSON.stringify({
          earnedPoints,
          totalPoints,
          percentage: Math.round(percentage * 100),
          breakdown,
        }),
        score,
        autoGraded: true,
        status: AssignmentStatus.GRADED,
        gradedAt: new Date(),
        feedback: `Auto-graded: ${earnedPoints}/${totalPoints} points (${Math.round(
          percentage * 100,
        )}%).`,
      },
    });

    const certificate = await this.maybeIssueCertificate(userId, assignment.courseId);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, email: true },
    });
    const passed =
      assignment.passScore === null ||
      score >= Number(assignment.passScore || 0);
    if (user) {
      await this.notifications.create({
        userId,
        type: 'ASSIGNMENT',
        title: `Quiz graded: ${assignment.title}`,
        body: `You scored ${score}/${assignment.maxScore} (${Math.round(
          percentage * 100,
        )}%).`,
        link: '/assignments',
      });
      await this.mail.sendTemplate('assignment-graded', user.email, {
        firstName: user.firstName,
        assignmentTitle: assignment.title,
        score,
        maxScore: assignment.maxScore,
        status: passed ? 'Passed' : 'Needs improvement',
        feedback: submission.feedback,
        certificateUrl: certificate
          ? `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${certificate.certificateCode}`
          : undefined,
      });
    }

    await this.realtime.trigger('private-admin', 'assignment:submitted', {
      assignmentId,
      submissionId: submission.id,
      userId,
      autoGraded: true,
    });
    return {
      ...submission,
      result: {
        earnedPoints,
        totalPoints,
        percentage: Math.round(percentage * 100),
        passed,
        breakdown,
      },
    };
  }

  async submissions(assignmentId: string, user: any) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { courseId: true },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');
    await this.assertCourseAccess(assignment.courseId, user);

    return this.prisma.assignmentSubmission.findMany({
      where: { assignmentId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
        gradedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  /**
   * If the course was already completed, a late-graded assignment can make the
   * certificate newly available. ensureForEnrollment is idempotent and sends
   * the certificate email when it creates one.
   */
  private async maybeIssueCertificate(userId: string, courseId: string) {
    try {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
        select: { id: true, status: true },
      });
      if (enrollment?.status === 'COMPLETED') {
        return await this.certificates.ensureForEnrollment(enrollment.id);
      }
    } catch {
      // certificate delivery is best-effort here; the dashboard can retry
    }
    return null;
  }

  async grade(submissionId: string, data: any, user: any) {
    const submission = await this.prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          select: { courseId: true, maxScore: true, title: true },
        },
        user: { select: { firstName: true, email: true } },
      },
    });
    if (!submission) throw new NotFoundException('Submission not found');
    await this.assertCourseAccess(submission.assignment.courseId, user);

    const score =
      data.score === undefined || data.score === null || data.score === ''
        ? null
        : parseFloat(data.score);
    if (score !== null && (score < 0 || score > submission.assignment.maxScore)) {
      throw new BadRequestException(
        `Score must be between 0 and ${submission.assignment.maxScore}`,
      );
    }

    const updated = await this.prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        score,
        feedback: data.feedback,
        status: AssignmentStatus.GRADED,
        gradedAt: new Date(),
        gradedById: user.sub,
      },
    });

    await this.notifications.create({
      userId: submission.userId,
      type: 'ASSIGNMENT',
      title: `Assignment graded: ${submission.assignment.title}`,
      body: `Score: ${score ?? '—'} / ${submission.assignment.maxScore}`,
      link: '/assignments',
    });

    const certificate = await this.maybeIssueCertificate(
      submission.userId,
      submission.assignment.courseId,
    );

    if (submission.user?.email) {
      await this.mail.sendTemplate('assignment-graded', submission.user.email, {
        firstName: submission.user.firstName,
        assignmentTitle: submission.assignment.title,
        score: score ?? '—',
        maxScore: submission.assignment.maxScore,
        status: 'Graded',
        feedback: data.feedback,
        certificateUrl: certificate
          ? `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${certificate.certificateCode}`
          : undefined,
      });
    }

    return updated;
  }
}

const normalizeText = (value: any): string =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

const safeJson = (value: string) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};
