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
import { JobApplicationStatus, JobType, Role } from '@prisma/client';
import { JobsService } from './jobs.service';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('jobs')
export class JobsController {
  constructor(private jobsService: JobsService) {}

  @Public()
  @Get()
  @Header('Cache-Control', 'public, max-age=20, stale-while-revalidate=60')
  async findAll(@Query() query: any) {
    return this.jobsService.findAll({
      page: query.page ? parseInt(query.page, 10) : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
      search: query.search,
      type: query.type as JobType,
      level: query.level,
      isRemote: query.isRemote !== undefined ? query.isRemote === 'true' : undefined,
      isFeatured: query.isFeatured !== undefined ? query.isFeatured === 'true' : undefined,
      publishedOnly: true,
    });
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermissions('MANAGE_JOBS')
  async findAllAdmin(@Query() query: any) {
    return this.jobsService.findAll({
      page: query.page ? parseInt(query.page, 10) : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
      search: query.search,
      type: query.type as JobType,
      publishedOnly: false,
    });
  }

  @Get('applications/my')
  @UseGuards(JwtAuthGuard)
  async myApplications(@CurrentUser() user: any) {
    return this.jobsService.myApplications(user.sub);
  }

  @Public()
  @Get('slug/:slug')
  @Header('Cache-Control', 'public, max-age=20, stale-while-revalidate=60')
  async findBySlug(@Param('slug') slug: string) {
    return this.jobsService.findBySlug(slug);
  }

  @Public()
  @Get(':id')
  @Header('Cache-Control', 'public, max-age=20, stale-while-revalidate=60')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.jobsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermissions('MANAGE_JOBS')
  async create(@Body() body: any, @CurrentUser() user: any) {
    return this.jobsService.create(body, user.sub);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermissions('MANAGE_JOBS')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.jobsService.update(id, body, user.sub, user.role, user.permissions || []);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermissions('MANAGE_JOBS')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.jobsService.remove(id);
  }

  @Post(':id/apply')
  @UseGuards(JwtAuthGuard)
  async apply(@Param('id', ParseUUIDPipe) id: string, @Body() body: any, @CurrentUser() user: any) {
    return this.jobsService.apply(id, user.sub, body);
  }

  @Get(':id/applications')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermissions('MANAGE_JOBS')
  async applications(@Param('id', ParseUUIDPipe) id: string) {
    return this.jobsService.applicationsForJob(id);
  }

  @Patch('applications/:applicationId')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermissions('MANAGE_JOBS')
  async updateApplication(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Body() body: { status: JobApplicationStatus; notes?: string },
  ) {
    return this.jobsService.updateApplication(applicationId, body);
  }
}
