import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../services/prisma.service';
import {
  EmailTemplate,
  RenderedEmail,
  renderEmail,
} from '../email/email.templates';

export interface MailMessage {
  to: string;
  subject?: string;
  text?: string;
  html?: string;
  template?: EmailTemplate;
  data?: Record<string, any>;
  replyTo?: string;
}

interface ResendResponse {
  id?: string;
  error?: { message?: string; name?: string };
}

/**
 * Sends transactional email through Resend.
 *
 * If RESEND_API_KEY is not configured the message is logged and recorded as
 * SKIPPED, so local development and offline demos never fail because of email.
 * Sending is deliberately non-throwing: a mail outage must not roll back a
 * payment approval or a certificate.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private get apiKey(): string {
    return (
      this.config.get<string>('RESEND_API_KEY') ||
      this.config.get<string>('Email_key_resend') ||
      ''
    );
  }

  private get from(): string {
    return (
      this.config.get<string>('EMAIL_FROM') ||
      'TweackTech <onboarding@resend.dev>'
    );
  }

  async sendTemplate(
    template: EmailTemplate,
    to: string,
    data: Record<string, any> = {},
  ): Promise<{ sent: boolean; id?: string }> {
    const rendered = renderEmail(template, data);
    return this.deliver({ to, ...rendered, template, data });
  }

  /**
   * Backwards-compatible entry point used by auth. Accepts either a ready
   * message or a template + data pair.
   */
  async send(message: MailMessage): Promise<{ sent: boolean; id?: string }> {
    if (message.template && !message.html) {
      const rendered = renderEmail(message.template, message.data || {});
      return this.deliver({
        ...message,
        subject: message.subject || rendered.subject,
        html: rendered.html,
        text: message.text || rendered.text,
      });
    }
    return this.deliver(message);
  }

  async sendBulk(
    template: EmailTemplate,
    recipients: string[],
    data: Record<string, any> = {},
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;
    for (const to of Array.from(new Set(recipients.filter(Boolean)))) {
      const result = await this.sendTemplate(template, to, data);
      if (result.sent) sent += 1;
      else failed += 1;
    }
    return { sent, failed };
  }

  private async deliver(
    message: MailMessage,
  ): Promise<{ sent: boolean; id?: string }> {
    const subject = message.subject || 'TweackTech';
    const template = message.template || 'generic';
    const text = message.text || '';
    const html =
      message.html ||
      `<p>${text.replace(/\n/g, '<br/>') || 'A message from TweackTech.'}</p>`;

    const key = this.apiKey.trim();
    if (!key) {
      this.logger.warn(
        `[mail:skipped] RESEND_API_KEY is not set. to=${message.to} subject="${subject}"`,
      );
      await this.log(message, template, 'SKIPPED', undefined, 'RESEND_API_KEY missing');
      return { sent: false };
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.from,
          to: [message.to],
          subject,
          html,
          text,
          reply_to: message.replyTo || this.config.get('SUPPORT_EMAIL') || undefined,
        }),
        signal: AbortSignal.timeout(12_000),
      });

      const payload = (await response.json().catch(() => ({}))) as ResendResponse;

      if (!response.ok || payload.error) {
        const error = payload.error?.message || `HTTP ${response.status}`;
        this.logger.error(`[mail:failed] to=${message.to} ${error}`);
        await this.log(message, template, 'FAILED', undefined, error);
        return { sent: false };
      }

      this.logger.log(`[mail:sent] to=${message.to} id=${payload.id}`);
      await this.log(message, template, 'SENT', payload.id);
      return { sent: true, id: payload.id };
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : 'Unknown email error';
      this.logger.error(`[mail:error] to=${message.to} ${messageText}`);
      await this.log(message, template, 'FAILED', undefined, messageText);
      return { sent: false };
    }
  }

  private async log(
    message: MailMessage,
    template: string,
    status: string,
    providerId?: string,
    error?: string,
  ) {
    try {
      await this.prisma.emailLog.create({
        data: {
          to: message.to,
          subject: message.subject || 'TweackTech',
          template,
          status,
          providerId,
          error,
        },
      });
    } catch (err) {
      // Logging is best effort; never mask the email result.
      this.logger.debug(
        `Could not record email log: ${err instanceof Error ? err.message : err}`,
      );
    }
  }
}
