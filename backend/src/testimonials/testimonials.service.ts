import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';

export interface TestimonialInput {
  content?: string;
  rating?: number;
  headline?: string;
  courseId?: string;
}

@Injectable()
export class TestimonialsService {
  private readonly logger = new Logger(TestimonialsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Public list — only approved, visible testimonials. */
  async visible(limit = 20) {
    return this.prisma.testimonial.findMany({
      where: { isVisible: true },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      take: Math.min(Math.max(Number(limit) || 20, 1), 50),
      select: {
        id: true,
        name: true,
        headline: true,
        content: true,
        rating: true,
        avatar: true,
        isFeatured: true,
        createdAt: true,
        course: { select: { id: true, title: true } },
      },
    });
  }

  /** Full list for staff moderation. */
  async all() {
    return this.prisma.testimonial.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
        course: { select: { id: true, title: true } },
      },
    });
  }

  async mine(userId: string) {
    return this.prisma.testimonial.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        headline: true,
        content: true,
        rating: true,
        isVisible: true,
        createdAt: true,
        course: { select: { id: true, title: true } },
      },
    });
  }

  async create(user: any, body: TestimonialInput) {
    const content = String(body?.content || '').trim();
    if (content.length < 10) {
      return { error: 'Please write at least 10 characters about your experience.' };
    }
    if (content.length > 1200) {
      return { error: 'Please keep your testimony under 1200 characters.' };
    }
    const rating = Math.min(Math.max(Number(body?.rating) || 5, 1), 5);
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email || 'Student';

    const created = await this.prisma.testimonial.create({
      data: {
        userId: user.sub,
        name,
        headline: String(body?.headline || '').trim().slice(0, 120) || null,
        content,
        rating,
        avatar: user.avatar || null,
        courseId: body?.courseId || null,
        isVisible: false,
      },
    });
    this.logger.log(`New testimony submitted by ${user.sub}; awaiting moderation.`);
    return { testimonial: created, message: 'Thank you! Your testimony will appear after review.' };
  }

  async setVisibility(id: string, isVisible: boolean, isFeatured = false) {
    return this.prisma.testimonial.update({
      where: { id },
      data: { isVisible, isFeatured: isVisible ? isFeatured : false },
    });
  }

  async remove(id: string) {
    return this.prisma.testimonial.delete({ where: { id } });
  }
}
