import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { CourseType, PaymentStatus, Role } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/services/prisma.service';
import { MailService } from '../common/services/mail.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CertificatesService {
  private readonly logger = new Logger(CertificatesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Issues a certificate when (and only when) a paid course has been fully
   * completed and the student has a completed payment. Safe to call repeatedly.
   */
  async ensureForEnrollment(enrollmentId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: { select: { id: true, title: true, type: true, slug: true } },
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        certificate: true,
        payments: { where: { status: PaymentStatus.COMPLETED } },
      },
    });

    if (!enrollment) return null;
    if (enrollment.certificate) return enrollment.certificate;

    if (enrollment.status !== 'COMPLETED' || enrollment.progress < 100) {
      return null;
    }
    if (enrollment.course.type === CourseType.FREE) {
      return null;
    }
    if (enrollment.payments.length === 0) {
      return null;
    }

    const code = `TT-${Date.now().toString(36).toUpperCase()}-${randomBytes(3)
      .toString('hex')
      .toUpperCase()}`;

    const score = Math.round(enrollment.progress);
    const certificate = await this.prisma.certificate.create({
      data: {
        userId: enrollment.userId,
        courseId: enrollment.courseId,
        enrollmentId,
        certificateCode: code,
        grade: this.calculateGrade(score),
        score,
      },
      include: {
        course: { select: { id: true, title: true, slug: true } },
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    await this.sendCertificateEmail(certificate);
    return certificate;
  }

  async generateCertificate(
    enrollmentId: string,
    userId: string,
    userRole: Role,
  ) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: { select: { type: true, title: true } },
        certificate: true,
      },
    });

    if (!enrollment) throw new NotFoundException('Enrollment not found');

    if (
      userRole !== Role.SUPERADMIN &&
      userRole !== Role.ADMIN &&
      enrollment.userId !== userId
    ) {
      throw new BadRequestException('Access denied');
    }

    if (enrollment.status !== 'COMPLETED') {
      throw new BadRequestException(
        'Complete every lesson in this course before requesting a certificate.',
      );
    }

    if (enrollment.course.type === CourseType.FREE) {
      throw new BadRequestException(
        'Certificates are issued for paid courses only. Upgrade this course to award certificates.',
      );
    }

    if (enrollment.certificate) return enrollment.certificate;

    const issued = await this.ensureForEnrollment(enrollmentId);
    if (!issued) {
      throw new BadRequestException(
        'A completed payment is required before this certificate can be issued.',
      );
    }
    return issued;
  }

  async findMyCertificates(userId: string) {
    return this.prisma.certificate.findMany({
      where: { userId },
      include: {
        course: { select: { id: true, title: true, slug: true, thumbnail: true } },
      },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async findById(id: string, userId: string, userRole: Role) {
    const certificate = await this.prisma.certificate.findUnique({
      where: { id },
      include: {
        course: true,
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        enrollment: true,
      },
    });

    if (!certificate) throw new NotFoundException('Certificate not found');

    if (
      userRole !== Role.SUPERADMIN &&
      userRole !== Role.ADMIN &&
      certificate.userId !== userId
    ) {
      throw new BadRequestException('Access denied');
    }

    return certificate;
  }

  async verify(code: string) {
    const certificate = await this.prisma.certificate.findUnique({
      where: { certificateCode: code },
      include: {
        course: { select: { id: true, title: true, slug: true } },
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!certificate) throw new NotFoundException('Certificate not found');

    return { valid: true, certificate };
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    courseId?: string;
    userId?: string;
  }) {
    const page = params.page || 1;
    const limit = Math.min(params.limit || 10, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.courseId) where.courseId = params.courseId;
    if (params.userId) where.userId = params.userId;

    const [certificates, total] = await this.prisma.$transaction([
      this.prisma.certificate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { issuedAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          course: { select: { id: true, title: true } },
        },
      }),
      this.prisma.certificate.count({ where }),
    ]);

    return {
      certificates,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  private async sendCertificateEmail(certificate: any) {
    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const verifyUrl = `${frontendUrl}/verify/${certificate.certificateCode}`;

    try {
      await this.mail.sendTemplate('certificate', certificate.user.email, {
        firstName: certificate.user.firstName,
        lastName: certificate.user.lastName,
        courseTitle: certificate.course?.title,
        certificateCode: certificate.certificateCode,
        issuedAt: new Date(certificate.issuedAt).toLocaleDateString(),
        grade: certificate.grade,
        url: verifyUrl,
      });
      await this.prisma.certificate.update({
        where: { id: certificate.id },
        data: { emailSentAt: new Date() },
      });
    } catch (error) {
      this.logger.warn(
        `Certificate email failed: ${
          error instanceof Error ? error.message : error
        }`,
      );
    }

    await this.notifications.create({
      userId: certificate.userId,
      type: 'CERTIFICATE',
      title: 'Certificate unlocked 🎓',
      body: `Your certificate for ${certificate.course?.title || 'your course'} is ready.`,
      link: `/verify/${certificate.certificateCode}`,
    });
  }

  private calculateGrade(score: number): string {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  }
}
