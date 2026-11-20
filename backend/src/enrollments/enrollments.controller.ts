import {
  Controller,
  Delete,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Logger,
  ParseUUIDPipe,
} from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('enrollments')
@UseGuards(JwtAuthGuard)
export class EnrollmentsController {
  private readonly logger = new Logger(EnrollmentsController.name);

  constructor(private enrollmentsService: EnrollmentsService) {}

  @Post('enroll/:courseId')
  async enroll(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser() user: any,
  ) {
    return this.enrollmentsService.enroll(user.sub, courseId);
  }

  @Get('my')
  async getMyEnrollments(@CurrentUser() user: any, @Query() query: any) {
    return this.enrollmentsService.findMyEnrollments(user.sub, {
      page: query.page ? parseInt(query.page, 10) : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
    });
  }

  @Get(':id')
  async getEnrollment(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.enrollmentsService.findById(id, user.sub, user.role);
  }

  @Patch('progress')
  async updateProgress(
    @Body() body: { enrollmentId: string; lessonId: string; progress: number },
    @CurrentUser() user: any,
  ) {
    return this.enrollmentsService.updateProgress(
      body.enrollmentId,
      body.lessonId,
      body.progress,
      user.sub,
    );
  }

  @Patch(':id/complete')
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF, Role.STUDENT)
  async markCompleted(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.enrollmentsService.markCompleted(id, user.sub, user.role);
  }


  @Get('course/:courseId')
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  async courseEnrollments(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser() user: any,
  ) {
    return this.enrollmentsService.findCourseEnrollments(courseId, user);
  }

  @Delete(':id')
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  async removeEnrollment(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.enrollmentsService.removeEnrollment(id, user);
  }

  @Get('course/:courseId/stats')
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  async getStats(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser() user: any,
  ) {
    return this.enrollmentsService.getEnrollmentStats(courseId, user.sub, user.role);
  }
}
