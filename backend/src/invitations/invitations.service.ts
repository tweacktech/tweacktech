import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  CourseType,
  InvitationAccessType,
  InvitationStatus,
  PaymentStatus,
  Role,
} from '@prisma/client';
import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/services/prisma.service';
import { MailService } from '../common/services/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { effectivePrice } from '../common/utils/course-pricing';

@Injectable()
export class InvitationsService {
  private readonly logger = new Logger(InvitationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService,
  ) {}

  private reference(prefix: string) {
    return `${prefix}-${Date.now().toString(36).toUpperCase()}-${randomBytes(3)
      .toString('hex')
      .toUpperCase()}`;
  }

  private async managedCourse(courseId: string, user: any) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        slug: true,
        price: true,
        currency: true,
        discountPrice: true,
        discountStart: true,
        discountEnd: true,
        type: true,
        enrollmentLocked: true,
        enrollmentLockedMessage: true,
        instructorId: true,
        instructors: { select: { userId: true } },
      },
    });
    if (!course) throw new NotFoundException('Course not found');

    const isAdmin = user.role === Role.SUPERADMIN || user.role === Role.ADMIN;
    const owns =
      course.instructorId === user.sub ||
      course.instructors.some((row) => row.userId === user.sub);
    if (!isAdmin && !owns) {
      throw new ForbiddenException('You only manage courses assigned to you');
    }
    return course;
  }

  async candidates(courseId: string, user: any, search = '') {
    await this.managedCourse(courseId, user);

    return this.prisma.user.findMany({
      where: {
        role: Role.STUDENT,
        isActive: true,
        enrollments: { none: { courseId } },
        courseInvitations: {
          none: {
            courseId,
            status: { in: [InvitationStatus.PENDING_PAYMENT, InvitationStatus.ACCEPTED] },
          },
        },
        ...(search
          ? {
              OR: [
                { email: { contains: search, mode: 'insensitive' } },
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 15,
    });
  }

  async listForCourse(courseId: string, user: any) {
    await this.managedCourse(courseId, user);
    return this.prisma.courseInvitation.findMany({
      where: { courseId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
        invitedBy: { select: { id: true, firstName: true, lastName: true } },
        payment: {
          select: { id: true, status: true, amount: true, currency: true, reference: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async myInvitations(userId: string) {
    return this.prisma.courseInvitation.findMany({
      where: { userId },
      include: {
        course: {
          select: { id: true, title: true, slug: true, thumbnail: true },
        },
        invitedBy: { select: { firstName: true, lastName: true } },
        payment: {
          select: { id: true, status: true, amount: true, currency: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async invite(
    courseId: string,
    actor: any,
    data: {
      email?: string;
      userId?: string;
      accessType?: InvitationAccessType | string;
      message?: string;
    },
  ) {
    const course = await this.managedCourse(courseId, actor);

    if (course.enrollmentLocked) {
      throw new BadRequestException(
        course.enrollmentLockedMessage ||
          'Enrolment for this course is closed. Unlock it before inviting students.',
      );
    }

    const email = String(data.email || '').trim().toLowerCase();
    if (!email && !data.userId) {
      throw new BadRequestException('Choose a student or provide an email address');
    }

    const student = data.userId
      ? await this.prisma.user.findUnique({
          where: { id: data.userId },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
          },
        })
      : await this.prisma.user.findFirst({
          where: { email: { equals: email, mode: 'insensitive' } },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
          },
        });

    if (!student || !student.isActive) {
      throw new NotFoundException(
        'No active student account matches that email. Ask them to register first.',
      );
    }
    if (student.role !== Role.STUDENT) {
      throw new BadRequestException('Only student accounts can be invited to a course');
    }

    const enrolled = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: student.id, courseId } },
      select: { id: true },
    });
    if (enrolled) {
      throw new BadRequestException('This student is already enrolled in the course');
    }

    const existing = await this.prisma.courseInvitation.findFirst({
      where: {
        courseId,
        userId: student.id,
        status: { in: [InvitationStatus.PENDING_PAYMENT, InvitationStatus.ACCEPTED] },
      },
      select: { id: true },
    });
    if (existing) {
      throw new BadRequestException('This student already has an active invitation');
    }

    const accessType =
      String(data.accessType || 'FREE').toUpperCase() === 'PAID'
        ? InvitationAccessType.PAID
        : InvitationAccessType.FREE;

    const invitedByName = `${actor.firstName || ''} ${actor.lastName || ''}`.trim() || 'TweackTech';
    const frontendUrl = this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const message = data.message ? String(data.message).slice(0, 1000) : undefined;

    if (accessType === InvitationAccessType.FREE) {
      const enrollment = await this.prisma.enrollment.upsert({
        where: { userId_courseId: { userId: student.id, courseId } },
        update: { status: 'ACTIVE' },
        create: { userId: student.id, courseId, status: 'ACTIVE' },
      });

      const invitation = await this.prisma.courseInvitation.create({
        data: {
          courseId,
          invitedById: actor.sub,
          userId: student.id,
          email: student.email,
          accessType,
          status: InvitationStatus.ACCEPTED,
          message,
          acceptedAt: new Date(),
        },
        include: {
          user: true,
          course: { select: { id: true, title: true } },
        },
      });

      await this.notifications.create({
        userId: student.id,
        type: 'SYSTEM',
        title: `Free access to ${course.title}`,
        body: `${invitedByName} invited you to this course. No payment is required.`,
        link: `/courses/${courseId}`,
      });
      await this.mail.sendTemplate('course-invitation', student.email, {
        firstName: student.firstName,
        courseTitle: course.title,
        invitedByName,
        accessType: 'FREE',
        message,
        url: `${frontendUrl}/courses/${courseId}`,
      });

      return { invitation, enrollment, requiresPayment: false };
    }

    if (course.type === CourseType.FREE) {
      throw new BadRequestException(
        'This is a free course. Choose free access instead of paid.',
      );
    }

    const amount = effectivePrice(course);
    if (!(amount > 0)) {
      throw new BadRequestException('Set a course price before sending a paid invitation');
    }

    const reference = this.reference('INV');
    const payment = await this.prisma.payment.create({
      data: {
        userId: student.id,
        courseId,
        amount,
        currency: course.currency || 'USD',
        baseAmount: amount,
        baseCurrency: course.currency || 'USD',
        exchangeRate: 1,
        status: PaymentStatus.PENDING,
        paymentMethod: 'INVITATION',
        transactionId: reference,
        reference,
        adminNote: `Course invitation from ${invitedByName}`,
      },
    });

    let invitation: any;
    try {
      invitation = await this.prisma.courseInvitation.create({
        data: {
          courseId,
          invitedById: actor.sub,
          userId: student.id,
          email: student.email,
          accessType,
          status: InvitationStatus.PENDING_PAYMENT,
          message,
          paymentId: payment.id,
        },
        include: {
          user: true,
          course: { select: { id: true, title: true } },
          payment: true,
        },
      });
    } catch (error) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED, adminNote: 'Invitation creation failed' },
      });
      throw error;
    }

    await this.notifications.create({
      userId: student.id,
      type: 'PAYMENT',
      title: `Invitation: ${course.title}`,
      body: `${invitedByName} invited you. Complete the payment to unlock the course.`,
      link: '/payments',
    });
    await this.mail.sendTemplate('course-invitation', student.email, {
      firstName: student.firstName,
      courseTitle: course.title,
      invitedByName,
      accessType: 'PAID',
      amount,
      currency: course.currency || 'USD',
      message,
      url: `${frontendUrl}/payments`,
    });

    return { invitation, payment, requiresPayment: true };
  }

  async revoke(id: string, actor: any) {
    const invitation = await this.prisma.courseInvitation.findUnique({
      where: { id },
      include: {
        payment: { select: { id: true, status: true } },
        course: { select: { id: true } },
      },
    });
    if (!invitation) throw new NotFoundException('Invitation not found');
    await this.managedCourse(invitation.courseId, actor);

    if (invitation.status === InvitationStatus.ACCEPTED) {
      throw new BadRequestException('This invitation has already been accepted');
    }

    await this.prisma.$transaction([
      this.prisma.courseInvitation.update({
        where: { id },
        data: { status: InvitationStatus.REVOKED },
      }),
      ...(invitation.payment &&
      (invitation.payment.status === PaymentStatus.PENDING ||
        invitation.payment.status === PaymentStatus.AWAITING_APPROVAL)
        ? [
            this.prisma.payment.update({
              where: { id: invitation.payment.id },
              data: { status: PaymentStatus.FAILED, adminNote: 'Invitation revoked' },
            }),
          ]
        : []),
    ]);

    return { revoked: true };
  }
}
