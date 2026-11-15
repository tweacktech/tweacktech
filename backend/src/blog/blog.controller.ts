import {
  Controller,
  Get,
  Header,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  ParseUUIDPipe,
} from '@nestjs/common';
import { BlogService } from './blog.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';

@Controller('blog')
export class BlogController {
  private readonly logger = new Logger(BlogController.name);

  constructor(private blogService: BlogService) {}

  @Public()
  @Get()
  @Header('Cache-Control', 'public, max-age=20, stale-while-revalidate=60')
  async findAll(@Query() query: any) {
    return this.blogService.findAll({
      page: query.page ? parseInt(query.page, 10) : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
      categoryId: query.categoryId,
      search: query.search,
      published: true,
    });
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermissions('MANAGE_BLOG')
  async findAllAdmin(@Query() query: any) {
    return this.blogService.findAll({
      page: query.page ? parseInt(query.page, 10) : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
      categoryId: query.categoryId,
      search: query.search,
      published: undefined,
    });
  }

  @Public()
  @Get('featured')
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=120')
  async getFeatured(@Query() query: { limit?: string }) {
    return this.blogService.getFeatured(query.limit ? parseInt(query.limit, 10) : 5);
  }

  @Public()
  @Get('categories')
  @Header('Cache-Control', 'public, max-age=120, stale-while-revalidate=300')
  async getCategories() {
    return this.blogService.getCategories();
  }

  @Public()
  @Get('slug/:slug')
  @Header('Cache-Control', 'public, max-age=20, stale-while-revalidate=60')
  async findBySlug(@Param('slug') slug: string) {
    return this.blogService.findBySlug(slug);
  }

  @Public()
  @Get(':id')
  @Header('Cache-Control', 'public, max-age=20, stale-while-revalidate=60')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.blogService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermissions('MANAGE_BLOG')
  async create(@Body() body: any, @CurrentUser() user: any) {
    return this.blogService.create(body, user.sub);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.blogService.update(id, body, user.sub, user.role, user.permissions || []);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.blogService.delete(id, user.sub, user.role, user.permissions || []);
  }
}
