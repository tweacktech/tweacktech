import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Public()
  @Get()
  @Header('Cache-Control', 'public, max-age=20, stale-while-revalidate=60')
  async findAll(@Query() query: any) {
    return this.coursesService.findAll({
      page: query.page ? parseInt(query.page, 10) : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
      type: query.type,
      level: query.level,
      categoryId: query.categoryId,
      search: query.search,
      isPublished:
        query.isPublished !== undefined ? query.isPublished === 'true' : true,
      isFeatured:
        query.isFeatured !== undefined ? query.isFeatured === 'true' : undefined,
      instructorId: query.instructorId,
    });
  }

  @Public()
  @Get('search')
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=120')
  async search(@Query() query: { q: string; limit?: string }) {
    return this.coursesService.search(
      query.q,
      query.limit ? parseInt(query.limit, 10) : 10,
    );
  }

  @Public()
  @Get('categories')
  @Header('Cache-Control', 'public, max-age=120, stale-while-revalidate=300')
  async getCategories() {
    return this.coursesService.getCategories();
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyCourses(@CurrentUser() user: any) {
    return this.coursesService.getMyCourses(user.sub, user.role);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermissions('MANAGE_COURSES')
  async findAllAdmin(@Query() query: any, @CurrentUser() user: any) {
    return this.coursesService.findAll({
      page: query.page ? parseInt(query.page, 10) : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
      type: query.type,
      level: query.level,
      categoryId: query.categoryId,
      search: query.search,
      isPublished: undefined,
      isFeatured:
        query.isFeatured !== undefined ? query.isFeatured === 'true' : undefined,
      staffUserId: user.role === Role.STAFF ? user.sub : undefined,
    });
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermissions('MANAGE_COURSES')
  async findAdminById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.getAdminById(id, user);
  }

  @Get(':id/access')
  @UseGuards(JwtAuthGuard)
  async getAccess(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.getAccess(id, user);
  }

  @Get(':id/sessions')
  @UseGuards(JwtAuthGuard)
  async listSessions(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.listSessions(id, user);
  }

  @Public()
  @Get(':id')
  @Header('Cache-Control', 'public, max-age=20, stale-while-revalidate=60')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.coursesService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermissions('MANAGE_COURSES')
  async create(@Body() body: any, @CurrentUser() user: any) {
    return this.coursesService.create(body, user);
  }

  @Put(':id/instructors')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermissions('MANAGE_COURSES')
  async setInstructors(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { instructorId?: string; coInstructorIds?: string[] },
    @CurrentUser() user: any,
  ) {
    return this.coursesService.setInstructors(id, body, user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermissions('MANAGE_COURSES')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.update(id, body, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @RequirePermissions('MANAGE_COURSES')
  async delete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.coursesService.delete(id, user);
  }

  @Post(':courseId/modules')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermissions('MANAGE_COURSES')
  async createModule(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.createModule(courseId, body, user);
  }

  @Patch('modules/:moduleId')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermissions('MANAGE_COURSES')
  async updateModule(
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.updateModule(moduleId, body, user);
  }

  @Delete('modules/:moduleId')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermissions('MANAGE_COURSES')
  async deleteModule(
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.deleteModule(moduleId, user);
  }

  @Post('modules/:moduleId/lessons')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermissions('MANAGE_COURSES')
  async createLesson(
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.createLesson(moduleId, body, user);
  }

  @Patch('lessons/:lessonId')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermissions('MANAGE_COURSES')
  async updateLesson(
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.updateLesson(lessonId, body, user);
  }

  @Delete('lessons/:lessonId')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermissions('MANAGE_COURSES')
  async deleteLesson(
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.deleteLesson(lessonId, user);
  }

  @Post('modules/:moduleId/lessons/reorder')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermissions('MANAGE_COURSES')
  async reorderLessons(
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
    @Body() body: { lessonIds: string[] },
    @CurrentUser() user: any,
  ) {
    return this.coursesService.reorderLessons(moduleId, body.lessonIds || [], user);
  }

  @Post(':courseId/sessions')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  async createSession(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.createSession(courseId, body, user);
  }

  @Patch('sessions/:sessionId')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  async updateSession(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.updateSession(sessionId, body, user);
  }

  @Delete('sessions/:sessionId')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  async deleteSession(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.deleteSession(sessionId, user);
  }
}
