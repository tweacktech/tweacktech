import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { AssignmentsService } from './assignments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('assignments')
@UseGuards(JwtAuthGuard)
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Get('my')
  async myAssignments(@CurrentUser() user: any) {
    return this.assignmentsService.myAssignments(user.sub);
  }

  @Get('course/:courseId')
  async byCourse(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser() user: any,
  ) {
    return this.assignmentsService.byCourse(courseId, user);
  }

  /** Read-only staff preview: all module quizzes with questions and answers. */
  @Get('quizzes/overview')
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  async quizzesOverview() {
    return this.assignmentsService.quizzesOverview();
  }

  @Post('course/:courseId')
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  async create(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.assignmentsService.create(courseId, body, user);
  }

  @Post('course/:courseId/bulk')
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  async createBulk(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() body: { assignments?: any[] } | any[],
    @CurrentUser() user: any,
  ) {
    const items = Array.isArray(body) ? body : body?.assignments || [];
    return this.assignmentsService.createBulk(courseId, items, user);
  }

  @Get(':id/quiz')
  async getQuiz(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.assignmentsService.getQuiz(id, user);
  }

  @Post(':id/questions')
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  async addQuestions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.assignmentsService.addQuestions(id, body, user);
  }

  @Put(':id/questions')
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  async replaceQuestions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.assignmentsService.replaceQuestions(id, body, user);
  }

  @Patch('questions/:questionId')
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  async updateQuestion(
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.assignmentsService.updateQuestion(questionId, body, user);
  }

  @Delete('questions/:questionId')
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  async deleteQuestion(
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @CurrentUser() user: any,
  ) {
    return this.assignmentsService.deleteQuestion(questionId, user);
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.assignmentsService.findById(id, user);
  }

  @Put(':id')
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.assignmentsService.update(id, body, user);
  }

  @Delete(':id')
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.assignmentsService.remove(id, user);
  }

  @Post(':id/submit')
  async submit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.assignmentsService.submit(id, user.sub, body);
  }

  @Post(':id/submit-quiz')
  async submitQuiz(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { answers?: Record<string, any> } & Record<string, any>,
    @CurrentUser() user: any,
  ) {
    return this.assignmentsService.submitQuiz(
      id,
      user.sub,
      body.answers || body,
    );
  }

  @Get(':id/submissions')
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  async submissions(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.assignmentsService.submissions(id, user);
  }

  @Patch('submissions/:submissionId/grade')
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  async grade(
    @Param('submissionId', ParseUUIDPipe) submissionId: string,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.assignmentsService.grade(submissionId, body, user);
  }
}
