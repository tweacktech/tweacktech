import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { MailService } from '../common/services/mail.service';
import { EmailTemplate } from '../common/email/email.templates';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';

@Controller('email')
@UseGuards(JwtAuthGuard)
export class EmailController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  /** Send one branded template to verify the Resend setup. */
  @Post('test')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @RequirePermissions('MANAGE_SETTINGS')
  async test(
    @Body()
    body: { to: string; template?: EmailTemplate; data?: Record<string, any> },
  ) {
    const result = await this.mail.sendTemplate(
      body.template || 'welcome',
      body.to,
      body.data || { firstName: 'there' },
    );
    return { ...result, to: body.to, template: body.template || 'welcome' };
  }

  /** Send a promotion to newsletter subscribers or all active students. */
  @Post('promotion')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @RequirePermissions('MANAGE_SETTINGS')
  async promotion(
    @Body()
    body: {
      subject?: string;
      headline: string;
      body?: string;
      ctaUrl?: string;
      ctaLabel?: string;
      audience?: 'newsletter' | 'students' | 'all';
      emails?: string[];
    },
  ) {
    let recipients: string[] = body.emails || [];

    if (!recipients.length) {
      if (body.audience === 'newsletter' || body.audience === 'all' || !body.audience) {
        const subscribers = await this.prisma.newsletterSubscriber.findMany({
          where: { isActive: true },
          select: { email: true },
        });
        recipients.push(...subscribers.map((row) => row.email));
      }
      if (body.audience === 'students' || body.audience === 'all') {
        const students = await this.prisma.user.findMany({
          where: { isActive: true, role: Role.STUDENT },
          select: { email: true },
        });
        recipients.push(...students.map((row) => row.email));
      }
    }

    recipients = Array.from(new Set(recipients.filter(Boolean)));
    const result = await this.mail.sendBulk('promotion', recipients, {
      subject: body.subject,
      headline: body.headline,
      body: body.body,
      ctaUrl: body.ctaUrl,
      ctaLabel: body.ctaLabel,
      preheader: body.body,
    });

    return { ...result, recipients: recipients.length };
  }

  @Get('logs')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @RequirePermissions('MANAGE_SETTINGS')
  async logs(@Query() query: any) {
    const page = parseInt(query.page || '1', 10);
    const limit = Math.min(parseInt(query.limit || '25', 10), 100);
    const [logs, total] = await this.prisma.$transaction([
      this.prisma.emailLog.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.emailLog.count(),
    ]);
    return { logs, meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 } };
  }
}
