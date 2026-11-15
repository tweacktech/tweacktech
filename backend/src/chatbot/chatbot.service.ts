import { Injectable, Logger } from '@nestjs/common';
import { TicketPriority } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { ChatService } from '../chat/chat.service';
import { RealtimeService } from '../realtime/realtime.service';

export interface ChatbotReply {
  reply: string;
  intent: string;
  quickReplies: string[];
  action?: { type: 'navigate' | 'ticket'; url?: string; label?: string };
  cards?: Array<{ title: string; subtitle?: string; url: string }>;
}

const DEFAULT_QUICK_REPLIES = [
  'How do I pay for a course?',
  'How do certificates work?',
  'Show me available courses',
  'I need a human',
];

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly chat: ChatService,
    private readonly realtime: RealtimeService,
  ) {}

  async reply(input: { message?: string; path?: string }): Promise<ChatbotReply> {
    const raw = String(input.message || '').trim();
    const message = raw.toLowerCase();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    if (!raw) {
      return {
        reply: 'Hi! I am the TweackTech assistant. Ask me about courses, payments, certificates, assignments, live classes or your account.',
        intent: 'greeting',
        quickReplies: DEFAULT_QUICK_REPLIES,
      };
    }

    if (/(^|\b)(hi|hello|hey|good (morning|afternoon|evening))(\b|$)/.test(message)) {
      return {
        reply: 'Hello! 👋 I can help with course enrolment, bank-transfer payments, certificates, assignments and live classes. What do you need?',
        intent: 'greeting',
        quickReplies: DEFAULT_QUICK_REPLIES,
      };
    }

    if (/(human|agent|person|support|talk to someone|whatsapp)/.test(message)) {
      return {
        reply:
          'I can connect you with the support team. Use “Talk to a human” below and I will open a support chat and ticket for you. You can also email tweackchech@gmail.com.',
        intent: 'human',
        quickReplies: ['Talk to a human', 'What are your support hours?'],
        action: { type: 'ticket', label: 'Talk to a human' },
      };
    }

    if (/(refund|money back|cancel.*payment)/.test(message)) {
      return {
        reply:
          'Payments are reviewed before access is granted. If you were charged twice, or your transfer could not be verified, open a support ticket with your payment reference and receipt. Refunds are handled case by case by the admin team.',
        intent: 'refund',
        quickReplies: ['Talk to a human', 'How do I upload my receipt?'],
        action: { type: 'navigate', url: '/support', label: 'Open support' },
      };
    }

    if (/(pay|payment|bank|transfer|receipt|proof|paystack|card|naira|cedi|ghana|currency)/.test(message)) {
      let accounts = '';
      try {
        const rows = await this.prisma.bankAccount.findMany({
          where: { isActive: true },
          take: 3,
        });
        accounts = rows
          .map(
            (row) =>
              `• ${row.bankName} — ${row.accountNumber} (${row.accountName}, ${row.currency})`,
          )
          .join('\n');
      } catch {
        // database may be offline — still answer with the process
      }

      return {
        reply:
          'For bank transfer: open the course, choose “Bank transfer”, transfer the amount shown and use your reference as the narration. Then upload your receipt on the Payments page. An admin verifies it and unlocks the course. Card payments through Paystack are available when configured.' +
          (accounts ? `\n\nBank accounts:\n${accounts}` : ''),
        intent: 'payment',
        quickReplies: ['Upload my receipt', 'How long does approval take?', 'Talk to a human'],
        action: { type: 'navigate', url: '/payments', label: 'Go to payments' },
      };
    }

    if (/(certificate|graduate|certification)/.test(message)) {
      return {
        reply:
          'Certificates are issued automatically when you complete every lesson of a paid course and your payment is approved. They appear on your dashboard and can be verified publicly with your certificate ID.',
        intent: 'certificate',
        quickReplies: ['Show my dashboard', 'How do I complete a course?'],
        action: { type: 'navigate', url: '/dashboard', label: 'Open dashboard' },
      };
    }

    if (/(assignment|quiz|test|grade|score|submit)/.test(message)) {
      return {
        reply:
          'Open “My assignments” to submit text, files or projects. Quizzes are marked automatically as soon as you submit, and you will see the correct answers plus your score. If your instructor grades a written assignment, you will get a notification and an email.',
        intent: 'assignment',
        quickReplies: ['Open my assignments', 'How do I retake a quiz?'],
        action: { type: 'navigate', url: '/assignments', label: 'Open assignments' },
      };
    }

    if (/(live|calendar|class|session|schedule|reminder)/.test(message)) {
      return {
        reply:
          'Your calendar shows live classes scheduled by your instructors, assignments due, and reminders before each session. Instructors can also release modules and lessons on a specific week or day after you enrol.',
        intent: 'calendar',
        quickReplies: ['Open calendar', 'Talk to a human'],
        action: { type: 'navigate', url: '/calendar', label: 'Open calendar' },
      };
    }

    if (/(job|talent|hire|employer|career|cv|resume)/.test(message)) {
      return {
        reply:
          'The Talent Hub lists vetted tech professionals, and the Jobs board has open roles you can apply to with your TweackTech profile. You can track every application from your dashboard.',
        intent: 'talent',
        quickReplies: ['Browse jobs', 'Open Talent Hub'],
        action: { type: 'navigate', url: '/jobs', label: 'Browse jobs' },
      };
    }

    if (/(login|sign in|password|locked out|account|disabled|deactivated|email)/.test(message)) {
      return {
        reply:
          'For password problems, use “Forgot password” on the sign-in page and check your inbox for a reset link. If your account was disabled, contact support — disabled accounts are signed out immediately for security.',
        intent: 'account',
        quickReplies: ['Reset my password', 'Talk to a human'],
        action: { type: 'navigate', url: '/forgot-password', label: 'Reset password' },
      };
    }

    if (/(course|learn|price|cost|enrol|enroll|curriculum|python|react|data)/.test(message)) {
      const cards = await this.suggestCourses();
      return {
        reply: cards.length
          ? `Here are some courses you can start with. Prices are shown in your selected currency on the course page.`
          : 'Browse the course catalogue to see every published course, curriculum and price. Free courses enrol instantly; paid courses offer bank transfer or Paystack.',
        intent: 'courses',
        quickReplies: ['How do I pay for a course?', 'Do you offer certificates?', 'Talk to a human'],
        action: { type: 'navigate', url: '/courses', label: 'Browse courses' },
        cards: cards.map((course) => ({
          title: course.title,
          subtitle: `${course.type} · ${course.currency} ${course.price}`,
          url: `${frontendUrl}/courses/${course.id}`,
        })),
      };
    }

    if (/(thank|thanks|awesome|great|ok|okay)/.test(message)) {
      return {
        reply: 'Happy to help! Is there anything else you want to know?',
        intent: 'thanks',
        quickReplies: DEFAULT_QUICK_REPLIES,
      };
    }

    return {
      reply:
        'I am not sure I understood that. I can help with courses, bank-transfer payments, Paystack, certificates, assignments and quizzes, live-class calendars, jobs and account access. If you would rather speak to a person, I can open a support ticket.',
      intent: 'fallback',
      quickReplies: DEFAULT_QUICK_REPLIES,
      action: { type: 'ticket', label: 'Talk to a human' },
    };
  }

  async escalate(
    user: { sub: string; firstName?: string; lastName?: string; email?: string; role?: string },
    data: { message?: string; subject?: string },
  ) {
    const description =
      String(data.message || '').trim() ||
      'Hi, I need help from the TweackTech support team.';

    const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}`;

    const ticket = await this.prisma.supportTicket.create({
      data: {
        ticketNumber,
        subject: data.subject || 'Support chat follow-up',
        description,
        category: 'chatbot',
        priority: TicketPriority.MEDIUM,
        userId: user.sub,
      },
    });

    await this.realtime.trigger('private-admin', 'support:new', ticket);
    await this.realtime.trigger(`private-user-${user.sub}`, 'support:updated', {
      ticketId: ticket.id,
      status: ticket.status,
    });

    let roomId: string | null = null;
    try {
      const room = await this.chat.createSupportRoom(user);
      roomId = room.id;
      await this.chat.sendMessage(room.id, user, { body: description });
    } catch (error) {
      this.logger.warn(
        `Could not create support chat: ${
          error instanceof Error ? error.message : error
        }`,
      );
    }

    return {
      ticketNumber: ticket.ticketNumber,
      ticketId: ticket.id,
      roomId,
      message: roomId
        ? 'A support ticket was created and your support chat is ready.'
        : 'A support ticket was created. The team will reply by email.',
    };
  }

  private async suggestCourses() {
    try {
      return await this.prisma.course.findMany({
        where: { isPublished: true },
        select: {
          id: true,
          title: true,
          type: true,
          price: true,
          currency: true,
        },
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        take: 3,
      });
    } catch {
      return [];
    }
  }
}
