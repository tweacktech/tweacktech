import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomBytes } from 'crypto';
import {
  CourseType,
  PaymentStatus,
  Prisma,
  Role,
} from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { CurrenciesService } from '../currencies/currencies.service';
import { MailService } from '../common/services/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CertificatesService } from '../certificates/certificates.service';
import { MediaService } from '../media/media.service';
import { effectivePrice } from '../common/utils/course-pricing';
import { RealtimeService } from '../realtime/realtime.service';

const BANK_TRANSFER = 'BANK_TRANSFER';
const PAYSTACK = 'PAYSTACK';
const PAYMENT_INCLUDE = {
  course: {
    select: {
      id: true,
      title: true,
      slug: true,
      thumbnail: true,
      type: true,
      price: true,
      currency: true,
    },
  },
  user: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatar: true,
    },
  },
  enrollment: { select: { id: true, status: true, progress: true } },
  reviewedBy: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.PaymentInclude;

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly currencies: CurrenciesService,
    private readonly mail: MailService,
    private readonly notifications: NotificationsService,
    private readonly certificates: CertificatesService,
    private readonly media: MediaService,
    private readonly realtime: RealtimeService,
  ) {}

  private reference(prefix = 'TT') {
    return `${prefix}-${Date.now().toString(36).toUpperCase()}-${randomBytes(3)
      .toString('hex')
      .toUpperCase()}`;
  }

  private async getCourse(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        slug: true,
        type: true,
        price: true,
        currency: true,
        discountPrice: true,
        discountStart: true,
        discountEnd: true,
        isPublished: true,
        enrollmentLocked: true,
        enrollmentLockedMessage: true,
        instructorId: true,
      },
    });
    if (!course) throw new NotFoundException('Course not found');
    if (!course.isPublished) {
      throw new BadRequestException('This course is not open for enrolment yet');
    }
    if (course.type === CourseType.FREE) {
      throw new BadRequestException(
        'This is a free course — enrol directly from the course page',
      );
    }
    if (course.enrollmentLocked) {
      throw new BadRequestException(
        course.enrollmentLockedMessage ||
          'Enrolment for this course is temporarily closed. Please check back later.',
      );
    }
    return course;
  }

  private async assertNotEnrolled(userId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (enrollment) {
      throw new BadRequestException('You are already enrolled in this course');
    }
  }

  private async pricing(
    course: {
      price: number;
      currency: string;
      discountPrice?: number | null;
      discountStart?: Date | null;
      discountEnd?: Date | null;
    },
    currency?: string,
    requestedAmount?: number,
  ) {
    const target = (currency || course.currency || 'USD').toUpperCase();
    const basePrice = effectivePrice(course);
    const converted = await this.currencies.convert(
      basePrice,
      course.currency || 'USD',
      target,
    );
    const hasRequested = requestedAmount !== undefined && Number(requestedAmount) > 0;
    const amount = hasRequested ? Number(requestedAmount) : converted.converted;
    const base = hasRequested
      ? await this.currencies.convert(amount, target, course.currency || 'USD')
      : null;

    return {
      amount: Number(amount.toFixed(2)),
      currency: target,
      // baseAmount is always expressed in the course's own currency.
      baseAmount: Number(
        (hasRequested ? base?.converted || 0 : basePrice).toFixed(2),
      ),
      baseCurrency: course.currency || 'USD',
      exchangeRate: converted.rate,
    };
  }

  // -------------------------------------------------------------------------
  // Bank transfer
  // -------------------------------------------------------------------------

  async createBankTransfer(
    userId: string,
    data: { courseId: string; currency?: string; amount?: number },
  ) {
    const course = await this.getCourse(data.courseId);
    await this.assertNotEnrolled(userId, course.id);

    const existing = await this.prisma.payment.findFirst({
      where: {
        userId,
        courseId: course.id,
        status: { in: [PaymentStatus.PENDING, PaymentStatus.AWAITING_APPROVAL] },
      },
      orderBy: { createdAt: 'desc' },
    });

    const price = await this.pricing(course, data.currency, data.amount);

    const payment = existing
      ? await this.prisma.payment.update({
          where: { id: existing.id },
          data: {
            amount: price.amount,
            currency: price.currency,
            baseAmount: price.baseAmount,
            baseCurrency: price.baseCurrency,
            exchangeRate: price.exchangeRate,
            paymentMethod: BANK_TRANSFER,
          },
          include: PAYMENT_INCLUDE,
        })
      : await this.prisma.payment.create({
          data: {
            userId,
            courseId: course.id,
            amount: price.amount,
            currency: price.currency,
            baseAmount: price.baseAmount,
            baseCurrency: price.baseCurrency,
            exchangeRate: price.exchangeRate,
            status: PaymentStatus.PENDING,
            paymentMethod: BANK_TRANSFER,
            transactionId: this.reference('TXN'),
            reference: this.reference('BANK'),
          },
          include: PAYMENT_INCLUDE,
        });

    await this.realtime.trigger('private-admin', 'payment:created', {
      paymentId: payment.id,
      reference: payment.reference,
      userId,
      courseId: course.id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
    });

    const bankAccounts = await this.bankAccounts(price.currency);

    return {
      payment,
      bankAccounts,
      instructions: [
        `Transfer ${price.currency} ${price.amount.toLocaleString()} to any of the accounts below.`,
        'Use your payment reference as the transfer narration/description.',
        'Upload a screenshot or PDF of the receipt on your payments page.',
        'An admin will verify the transfer and unlock your course — usually within one business day.',
      ],
      reference: payment.reference,
    };
  }

  async bankAccounts(currency?: string) {
    const where: any = { isActive: true };
    if (currency) where.currency = currency.toUpperCase();
    const accounts = await this.prisma.bankAccount.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
    if (accounts.length > 0) return accounts;
    return this.prisma.bankAccount.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async uploadProof(
    paymentId: string,
    userId: string,
    file: Express.Multer.File,
    note?: string,
  ) {
    if (!file) throw new BadRequestException('Attach a receipt image or PDF');

    const allowed = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic',
      'application/pdf',
    ];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException('Proof must be a JPG, PNG, WEBP, HEIC or PDF file');
    }
    if (file.size > 4 * 1024 * 1024) {
      throw new BadRequestException('Proof file must be smaller than 4MB');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { course: { select: { title: true } }, user: true },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.userId !== userId) {
      throw new ForbiddenException('This payment does not belong to you');
    }
    if (payment.status === PaymentStatus.COMPLETED) {
      throw new BadRequestException('This payment is already approved');
    }

    const uploaded = await this.media.uploadFile(file, 'payment-proofs', userId);

    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        proofUrl: uploaded.url,
        proofUploadedAt: new Date(),
        status: PaymentStatus.AWAITING_APPROVAL,
        adminNote: note?.trim() || payment.adminNote,
        paymentMethod: payment.paymentMethod || BANK_TRANSFER,
      },
      include: PAYMENT_INCLUDE,
    });

    await this.notifications.create({
      userId,
      type: 'PAYMENT',
      title: 'Payment proof received',
      body: `We are reviewing your payment for ${payment.course?.title || 'your course'}.`,
      link: '/payments',
    });

    await this.mail.sendTemplate('payment-received', payment.user.email, {
      firstName: payment.user.firstName,
      courseTitle: payment.course?.title,
      reference: payment.reference,
      amount: payment.amount,
      currency: payment.currency,
    });

    await this.realtime.trigger(`private-user-${userId}`, 'payment:updated', {
      paymentId: updated.id,
      status: updated.status,
      reference: updated.reference,
    });
    await Promise.all([
      this.realtime.trigger('private-admin', 'payment:submitted', {
        paymentId: updated.id,
        reference: updated.reference,
        studentName: `${payment.user.firstName} ${payment.user.lastName}`,
        studentEmail: payment.user.email,
        courseTitle: payment.course?.title,
        amount: updated.amount,
        currency: updated.currency,
      }),
      this.realtime.trigger('private-admin', 'payment:created', {
        paymentId: updated.id,
        status: updated.status,
      }),
    ]);

    return updated;
  }

  // -------------------------------------------------------------------------
  // Admin review
  // -------------------------------------------------------------------------

  async review(
    paymentId: string,
    actor: { id: string; role: Role; permissions?: string[] },
    data: { action: 'approve' | 'reject'; note?: string },
  ) {
    const canReview =
      actor.role === Role.SUPERADMIN ||
      actor.role === Role.ADMIN ||
      (actor.permissions || []).includes('MANAGE_PAYMENTS');
    if (!canReview) throw new ForbiddenException('You cannot review payments');

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { course: true, user: true },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status === PaymentStatus.COMPLETED) {
      throw new BadRequestException('This payment has already been approved');
    }
    if (data.action === 'reject') {
      const updated = await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.REJECTED,
          adminNote: data.note,
          reviewedById: actor.id,
          reviewedAt: new Date(),
        },
        include: PAYMENT_INCLUDE,
      });

      await this.notifications.create({
        userId: payment.userId,
        type: 'PAYMENT',
        title: 'Payment needs attention',
        body: data.note || 'Your payment proof could not be verified. Please re-upload it.',
        link: '/payments',
      });
      await this.mail.sendTemplate('payment-rejected', payment.user.email, {
        firstName: payment.user.firstName,
        courseTitle: payment.course?.title,
        reason: data.note,
      });
      await this.realtime.trigger(`private-user-${payment.userId}`, 'payment:updated', {
        paymentId: updated.id,
        status: updated.status,
        reference: updated.reference,
      });
      await this.realtime.trigger('private-admin', 'payment:reviewed', {
        paymentId: updated.id,
        status: updated.status,
      });
      return updated;
    }

    return this.completePayment(payment.id, {
      actorId: actor.id,
      note: data.note,
      method: payment.paymentMethod || BANK_TRANSFER,
    });
  }

  /**
   * Single completion path shared by admin approval, Paystack verification and
   * the Paystack webhook. Idempotent: a completed payment is returned as-is.
   */
  async completePayment(
    paymentId: string,
    options: { actorId?: string; note?: string; method?: string; gatewayResponse?: any } = {},
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { course: true, user: true },
    });
    if (!payment) throw new NotFoundException('Payment not found');

    if (payment.status === PaymentStatus.COMPLETED) {
      return this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: PAYMENT_INCLUDE,
      });
    }

    if (!payment.courseId) {
      throw new BadRequestException('This payment is not linked to a course');
    }

    const courseId = payment.courseId;
    const userId = payment.userId;

    // Two idempotent writes instead of an interactive transaction. Neon's
    // pooled connections occasionally drop an interactive transaction; this
    // path must stay reliable because it grants paid course access.
    const enrollment = await this.prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: { status: 'ACTIVE' },
      create: { userId, courseId, status: 'ACTIVE' },
    });

    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.COMPLETED,
        paidAt: new Date(),
        enrollmentId: enrollment.id,
        reviewedById: options.actorId,
        reviewedAt: new Date(),
        adminNote: options.note ?? payment.adminNote,
        paymentMethod: options.method || payment.paymentMethod,
        gatewayResponse: options.gatewayResponse
          ? JSON.stringify(options.gatewayResponse).slice(0, 8000)
          : payment.gatewayResponse,
      },
      include: PAYMENT_INCLUDE,
    });

    await this.prisma.courseInvitation.updateMany({
      where: { paymentId },
      data: { status: 'ACCEPTED', acceptedAt: new Date() },
    });

    const result = { payment: updated, enrollment };

    await this.notifications.create({
      userId,
      type: 'PAYMENT',
      title: 'Payment approved',
      body: `You now have access to ${payment.course?.title || 'your course'}.`,
      link: `/courses/${courseId}`,
    });

    await this.mail.sendTemplate('payment-approved', payment.user.email, {
      firstName: payment.user.firstName,
      courseTitle: payment.course?.title,
      reference: payment.reference,
      amount: payment.amount,
      currency: payment.currency,
      url: `${this.config.get('FRONTEND_URL') || 'http://localhost:3000'}/courses/${courseId}`,
    });

    // If the student had already finished the coursework, issue the
    // certificate immediately now that the course is paid for.
    try {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: { id: result.enrollment.id },
        select: { status: true },
      });
      if (enrollment?.status === 'COMPLETED') {
        await this.certificates.ensureForEnrollment(result.enrollment.id);
      }
    } catch (error) {
      this.logger.warn(
        `Certificate auto-issue after payment failed: ${
          error instanceof Error ? error.message : error
        }`,
      );
    }

    await this.realtime.trigger(`private-user-${userId}`, 'payment:updated', {
      paymentId: result.payment?.id,
      status: PaymentStatus.COMPLETED,
      courseId,
    });
    await this.realtime.trigger('private-admin', 'payment:reviewed', {
      paymentId: result.payment?.id,
      status: PaymentStatus.COMPLETED,
      userId,
      courseId,
    });

    return result.payment;
  }

  // -------------------------------------------------------------------------
  // Paystack
  // -------------------------------------------------------------------------

  private paystackKey() {
    return this.config.get<string>('PAYSTACK_SECRET_KEY') || '';
  }

  async initializePaystack(
    userId: string,
    data: { courseId: string; currency?: string; amount?: number },
  ) {
    const key = this.paystackKey();
    if (!key) {
      throw new ServiceUnavailableException({
        message:
          'Automatic card payment is not switched on yet. Use bank transfer — upload your receipt and an admin will approve it.',
        code: 'PAYSTACK_NOT_CONFIGURED',
      });
    }

    const course = await this.getCourse(data.courseId);
    await this.assertNotEnrolled(userId, course.id);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const price = await this.pricing(course, data.currency, data.amount);
    const currency = price.currency;
    if (!['NGN', 'GHS', 'ZAR', 'KES', 'USD'].includes(currency)) {
      throw new BadRequestException(
        `Paystack does not support ${currency}. Please use bank transfer.`,
      );
    }

    const reference = this.reference('PSK');

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        courseId: course.id,
        amount: price.amount,
        currency,
        baseAmount: price.baseAmount,
        baseCurrency: price.baseCurrency,
        exchangeRate: price.exchangeRate,
        status: PaymentStatus.PENDING,
        paymentMethod: PAYSTACK,
        transactionId: reference,
        reference,
      },
    });

    try {
      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          amount: Math.round(price.amount * 100),
          currency,
          reference,
          callback_url: `${
            this.config.get('FRONTEND_URL') || 'http://localhost:3000'
          }/payments/callback?reference=${encodeURIComponent(reference)}`,
          metadata: {
            paymentId: payment.id,
            courseId: course.id,
            userId,
            custom_fields: [
              { display_name: 'Course', variable_name: 'course', value: course.title },
            ],
          },
        }),
        signal: AbortSignal.timeout(15_000),
      });

      const payload: any = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.status) {
        throw new Error(payload?.message || `Paystack HTTP ${response.status}`);
      }

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { gatewayResponse: JSON.stringify(payload.data).slice(0, 8000) },
      });

      return {
        payment,
        authorizationUrl: payload.data.authorization_url,
        accessCode: payload.data.access_code,
        reference,
      };
    } catch (error) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          gatewayResponse:
            error instanceof Error ? error.message : 'Paystack initialization failed',
        },
      });
      this.logger.error(
        `Paystack init failed: ${error instanceof Error ? error.message : error}`,
      );
      throw new BadRequestException({
        message:
          'We could not start the card payment. Please try again or use bank transfer.',
        code: 'PAYSTACK_INIT_FAILED',
      });
    }
  }

  async verifyPaystack(reference: string, userId?: string) {
    const key = this.paystackKey();
    if (!key) {
      throw new ServiceUnavailableException({
        message: 'Card payments are not configured.',
        code: 'PAYSTACK_NOT_CONFIGURED',
      });
    }

    const payment = await this.prisma.payment.findFirst({
      where: { reference, paymentMethod: PAYSTACK },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (userId && payment.userId !== userId) {
      throw new ForbiddenException('This payment does not belong to you');
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      return this.prisma.payment.findUnique({
        where: { id: payment.id },
        include: PAYMENT_INCLUDE,
      });
    }

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: { Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(15_000),
      },
    );
    const payload: any = await response.json().catch(() => ({}));

    if (!response.ok || !payload?.status || payload?.data?.status !== 'success') {
      throw new BadRequestException({
        message: payload?.message || 'Payment has not been confirmed by Paystack yet.',
        code: 'PAYSTACK_NOT_SUCCESSFUL',
      });
    }

    return this.completePayment(payment.id, {
      method: PAYSTACK,
      gatewayResponse: payload.data,
    });
  }

  async handlePaystackWebhook(rawBody: Buffer | string | undefined, signature?: string) {
    const key = this.paystackKey();
    if (!key || !rawBody || !signature) return { received: false };

    const raw = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody);
    const expected = createHmac('sha512', key).update(raw).digest('hex');
    if (expected !== signature) {
      this.logger.warn('Rejected Paystack webhook with invalid signature');
      return { received: false };
    }

    let event: any;
    try {
      event = JSON.parse(raw.toString('utf8'));
    } catch {
      return { received: false };
    }

    if (event?.event === 'charge.success' && event?.data?.reference) {
      const payment = await this.prisma.payment.findFirst({
        where: { reference: event.data.reference, paymentMethod: PAYSTACK },
      });
      if (payment) {
        await this.completePayment(payment.id, {
          method: PAYSTACK,
          gatewayResponse: event.data,
        });
      }
    }

    return { received: true };
  }

  // -------------------------------------------------------------------------
  // Queries
  // -------------------------------------------------------------------------

  async findMyPayments(
    userId: string,
    params: { page?: number; limit?: number },
  ) {
    const page = params.page || 1;
    const limit = Math.min(params.limit || 10, 100);
    const skip = (page - 1) * limit;

    const [payments, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          course: {
            select: { id: true, title: true, slug: true, thumbnail: true, type: true },
          },
          enrollment: { select: { id: true, status: true } },
          reviewedBy: { select: { firstName: true, lastName: true } },
        },
      }),
      this.prisma.payment.count({ where: { userId } }),
    ]);

    return {
      payments,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  async findOne(id: string, user: { sub: string; role: Role; permissions?: string[] }) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: PAYMENT_INCLUDE,
    });
    if (!payment) throw new NotFoundException('Payment not found');

    const canManage =
      user.role === Role.SUPERADMIN ||
      user.role === Role.ADMIN ||
      (user.permissions || []).includes('MANAGE_PAYMENTS');
    if (!canManage && payment.userId !== user.sub) {
      throw new ForbiddenException('You cannot view this payment');
    }
    return payment;
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    status?: PaymentStatus;
    method?: string;
    search?: string;
  }) {
    const page = params.page || 1;
    const limit = Math.min(params.limit || 10, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.method) where.paymentMethod = params.method;
    if (params.search) {
      where.OR = [
        { reference: { contains: params.search, mode: 'insensitive' } },
        { transactionId: { contains: params.search, mode: 'insensitive' } },
        { user: { email: { contains: params.search, mode: 'insensitive' } } },
        { user: { firstName: { contains: params.search, mode: 'insensitive' } } },
        { user: { lastName: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    const [payments, total, awaiting] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: PAYMENT_INCLUDE,
      }),
      this.prisma.payment.count({ where }),
      this.prisma.payment.count({
        where: { status: PaymentStatus.AWAITING_APPROVAL },
      }),
    ]);

    return {
      payments,
      awaiting,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  async getRevenueStats() {
    const [completed, pending, awaiting, totalTransactions] =
      await this.prisma.$transaction([
        this.prisma.payment.aggregate({
          where: { status: PaymentStatus.COMPLETED },
          _sum: { baseAmount: true, amount: true },
        }),
        this.prisma.payment.count({ where: { status: PaymentStatus.PENDING } }),
        this.prisma.payment.count({
          where: { status: PaymentStatus.AWAITING_APPROVAL },
        }),
        this.prisma.payment.count({ where: { status: PaymentStatus.COMPLETED } }),
      ]);

    return {
      totalRevenueUsd: completed._sum.baseAmount || 0,
      totalRevenue: completed._sum.amount || 0,
      pending,
      awaitingApproval: awaiting,
      totalTransactions,
    };
  }

  // -------------------------------------------------------------------------
  // Bank account management
  // -------------------------------------------------------------------------

  async createBankAccount(data: any) {
    if (!data.bankName || !data.accountName || !data.accountNumber) {
      throw new BadRequestException('Bank name, account name and account number are required');
    }
    return this.prisma.bankAccount.create({
      data: {
        bankName: data.bankName,
        accountName: data.accountName,
        accountNumber: data.accountNumber,
        currency: (data.currency || 'NGN').toUpperCase(),
        branch: data.branch,
        instructions: data.instructions,
        isActive: data.isActive === undefined ? true : data.isActive === true,
      },
    });
  }

  async updateBankAccount(id: string, data: any) {
    return this.prisma.bankAccount.update({
      where: { id },
      data: {
        bankName: data.bankName,
        accountName: data.accountName,
        accountNumber: data.accountNumber,
        currency: data.currency ? data.currency.toUpperCase() : undefined,
        branch: data.branch,
        instructions: data.instructions,
        isActive: data.isActive === undefined ? undefined : data.isActive === true,
      },
    });
  }

  async removeBankAccount(id: string) {
    await this.prisma.bankAccount.delete({ where: { id } });
    return { deleted: true };
  }
}
