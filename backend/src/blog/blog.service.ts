import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class BlogService {
  private readonly logger = new Logger(BlogService.name);

  constructor(private prisma: PrismaService) {}

  async create(data: any, authorId: string) {
    return this.prisma.blogPost.create({
      data: {
        title: data.title,
        slug: data.slug || this.generateSlug(data.title),
        excerpt: data.excerpt,
        content: data.content,
        featuredImage: data.featuredImage,
        isPublished: data.isPublished === 'true' || data.isPublished === true,
        isFeatured: data.isFeatured === 'true' || data.isFeatured === true,
        categoryId: data.categoryId,
        tags: data.tags,
        authorId,
        publishedAt: data.isPublished ? new Date() : undefined,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
        category: true,
      },
    });
  }

  async findAll(params: { page?: number; limit?: number; categoryId?: string; search?: string; published?: boolean }) {
    const page = params.page || 1;
    const limit = Math.min(params.limit || 10, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.categoryId) where.categoryId = params.categoryId;
    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { content: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params.published !== undefined) where.isPublished = params.published;

    const [posts, total] = await this.prisma.$transaction([
      this.prisma.blogPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          category: true,
        },
      }),
      this.prisma.blogPost.count({ where }),
    ]);

    return {
      posts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const post = await this.prisma.blogPost.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatar: true, bio: true } },
        category: true,
      },
    });

    if (!post) {
      throw new NotFoundException('Blog post not found');
    }

    // Increment view count
    await this.prisma.blogPost.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return post;
  }

  async findBySlug(slug: string) {
    const post = await this.prisma.blogPost.findUnique({
      where: { slug },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        category: true,
      },
    });

    if (!post) {
      throw new NotFoundException('Blog post not found');
    }

    await this.prisma.blogPost.update({
      where: { slug },
      data: { viewCount: { increment: 1 } },
    });

    return post;
  }

  async update(id: string, data: any, userId: string, userRole: Role, permissions: string[] = []) {
    const post = await this.prisma.blogPost.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!post) {
      throw new NotFoundException('Blog post not found');
    }

    const canManage = userRole === Role.SUPERADMIN || permissions.includes('MANAGE_BLOG');
    if (!canManage && post.authorId !== userId) {
      throw new BadRequestException('You can only edit your own posts');
    }

    return this.prisma.blogPost.update({
      where: { id },
      data: {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: data.content,
        featuredImage: data.featuredImage,
        isPublished: data.isPublished,
        isFeatured: data.isFeatured,
        categoryId: data.categoryId,
        tags: data.tags,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
        category: true,
      },
    });
  }

  async delete(id: string, userId: string, userRole: Role, permissions: string[] = []) {
    const post = await this.prisma.blogPost.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!post) {
      throw new NotFoundException('Blog post not found');
    }

    const canManage = userRole === Role.SUPERADMIN || permissions.includes('MANAGE_BLOG');
    if (!canManage && post.authorId !== userId) {
      throw new BadRequestException('You can only delete your own posts');
    }

    return this.prisma.blogPost.delete({ where: { id } });
  }

  async getCategories() {
    return this.prisma.category.findMany({
      where: { parentId: null },
      include: {
        _count: { select: { blogPosts: true, courses: true } },
        children: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async getFeatured(limit: number = 5) {
    return this.prisma.blogPost.findMany({
      where: { isPublished: true, isFeatured: true },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { firstName: true, lastName: true } },
        category: true,
      },
    });
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+$/, '')
      .replace(/^-+/, '');
  }
}
