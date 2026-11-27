import { BadRequestException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { BlogService } from '../blog/blog.service';
import { MediaService } from '../media/media.service';
import { PrismaService } from '../common/services/prisma.service';
import { sentenceExcerpt } from '../common/utils/text';

// Anything shorter than this reads as a stub and is held as a draft.
const MIN_ARTICLE_WORDS = 300;

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

    const fullContent = String(body.content || body.full || '');
    const rawContent = fullContent || String(body.summary || body.excerpt || '');
    const plain = rawContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const summaryText = String(body.excerpt || body.summary || '');
    const summaryPlain = summaryText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const excerpt = sentenceExcerpt(summaryText || plain, 240);
    // The RSS feed often sends the summary again as the body. Publishing that
    // as the first paragraph duplicates the visible excerpt, so keep it out of
    // the article body and let original commentary be the content instead.
    const summaryOnly = !fullContent || plain === summaryPlain;

    const source = String(body.sourceUrl || body.link || body.source || '').trim();
    const isSyndicated = /^https?:\/\//i.test(source);
    const sourceLink = isSyndicated
      ? `<p class="source"><a href="${source.replace(/"/g, '&quot;')}" rel="nofollow noopener" target="_blank">Further reading: the original report</a></p>`
      : '';

    // A syndicated item needs original commentary to be publishable. Google
    // treats a republished article with only a source link as replicated
    // content, so anything without commentary is stored as a draft that an
    // editor has to finish by hand.
    const commentary = String(
      body.commentary || body.analysis || body.original || '',
    ).trim();
    const commentaryBlock = commentary
      ? `<h2>Why this matters for learners</h2><p>${commentary
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')}</p>`
      : '';

    const bodyHtml = summaryOnly ? '' : rawContent;
    const content =
      `${bodyHtml}${commentaryBlock}${sourceLink}` || `<p>${excerpt}</p>${sourceLink}`;

    const tags = Array.isArray(body.tags)
      ? body.tags.map((item: unknown) => String(item).trim()).filter(Boolean)
      : typeof body.tags === 'string'
      ? body.tags
          .split(/[,\n]/)
          .map((item: string) => item.trim())
          .filter(Boolean)
      : [];

    const requestedPublish = body.isPublished !== false;
    const articlePlain = `${bodyHtml} ${commentary}`
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const wordCount = articlePlain.split(/\s+/).filter(Boolean).length;
    // Thin posts and bare republished articles are the two patterns that get a
    // site rejected for low-value content, so neither publishes unattended.
    const tooShort = wordCount < MIN_ARTICLE_WORDS;
    const needsCommentary = isSyndicated && !commentary;
    const canPublish = requestedPublish && !tooShort && !needsCommentary;

    const post = await this.blog.create(
      {
        title,
        excerpt,
        content,
        featuredImage: featuredImage || null,
        isPublished: canPublish,
        isFeatured: body.isFeatured === true && canPublish,
        categoryId: body.categoryId || null,
        tags: tags.length ? tags.join(', ') : null,
      },
      author.id,
    );

    let moderation = 'published';
    if (!canPublish) {
      if (needsCommentary) {
        moderation =
          'draft: syndicated content needs an original "commentary" field before it can publish';
      } else if (tooShort) {
        moderation = `draft: ${wordCount} words is below the ${MIN_ARTICLE_WORDS} word minimum for publishing`;
      } else {
        moderation = 'draft: publishing was not requested';
      }
    }

    return { ...post, moderation };
  }
}
