import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { InvitationsService } from './invitations.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class InvitationsController {
  constructor(private readonly invitations: InvitationsService) {}

  @Get('courses/:courseId/invite-candidates')
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  async candidates(
    @Param('courseId') courseId: string,
    @Query('search') search: string,
    @CurrentUser() user: any,
  ) {
    return this.invitations.candidates(courseId, user, search || '');
  }

  @Get('courses/:courseId/invitations')
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  async listForCourse(@Param('courseId') courseId: string, @CurrentUser() user: any) {
    return this.invitations.listForCourse(courseId, user);
  }

  @Post('courses/:courseId/invitations')
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  async invite(
    @Param('courseId') courseId: string,
    @Body()
    body: {
      email?: string;
      userId?: string;
      accessType?: string;
      message?: string;
    },
    @CurrentUser() user: any,
  ) {
    return this.invitations.invite(courseId, user, body);
  }

  @Get('invitations/my')
  async myInvitations(@CurrentUser() user: any) {
    return this.invitations.myInvitations(user.sub);
  }

  @Post('invitations/:id/revoke')
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  async revoke(@Param('id') id: string, @CurrentUser() user: any) {
    return this.invitations.revoke(id, user);
  }
}
