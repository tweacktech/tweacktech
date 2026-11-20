import { BadRequestException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { BlogService } from '../blog/blog.service';
import { MediaService } from '../media/media.service';
import { PrismaService } from '../common/services/prisma.service';

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly blog: BlogService,
    private readonly media: MediaService,
    private readonly prisma: PrismaService,
  ) {}

  async createBlog(body: any) {
    const title = String(body?.title || '').trim();
    if (!title) throw new BadRequestException('title is required');

    const authorEmail = process.env.N8N_AUTHOR_EMAIL || 'meyorpop@gmail.com';
    let author = await this.prisma.user.findUnique({ where: { email: authorEmail } });
    if (!author) {
      author = await this.prisma.user.findFirst({ where: { role: Role.SUPERADMIN } });
    }
    if (!author) throw new BadRequestException('No author account is configured for posts');

    let featuredImage = String(
      body.featuredImage || body.image || body.image_url || body.imageUrl || '',
    ).trim();
    if (featuredImage.startsWith('data:')) {
      featuredImage = await this.media.uploadDataUrl(featuredImage, 'blog');
    }

    const rawContent = String(
      body.content || body.full || body.summary || body.excerpt || '',
    );
    const plain = rawContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const excerpt = String(body.excerpt || body.summary || plain).slice(0, 240);

    const source = String(body.sourceUrl || body.link || body.source || '').trim();
    const sourceLink = /^https?:\/\//i.test(source)
      ? `<p class="source"><a href="${source.replace(/"/g, '&quot;')}" rel="nofollow noopener" target="_blank">Read the original source</a></p>`
      : '';
    const content = rawContent
      ? `${rawContent}${sourceLink}`
      : `<p>${plain || excerpt}</p>${sourceLink}`;

    const tags = Array.isArray(body.tags)
      ? body.tags.map((item: unknown) => String(item).trim()).filter(Boolean)
      : typeof body.tags === 'string'
      ? body.tags
          .split(/[,\n]/)
          .map((item: string) => item.trim())
          .filter(Boolean)
      : [];

    return this.blog.create(
      {
        title,
        excerpt,
        content,
        featuredImage: featuredImage || null,
        isPublished: body.isPublished !== false,
        isFeatured: body.isFeatured === true,
        categoryId: body.categoryId || null,
        tags: tags.length ? tags.join(', ') : null,
      },
      author.id,
    );
  }
}
