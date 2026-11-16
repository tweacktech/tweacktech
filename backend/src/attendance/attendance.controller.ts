import {
  Body,
  Controller,
  Get,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private readonly attendance: AttendanceService) {}

  @Get('my')
  async mine(@CurrentUser() user: any) {
    return this.attendance.my(user.sub);
  }

  @Get()
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  async byCourse(
    @Query('courseId', ParseUUIDPipe) courseId: string,
    @Query('date') date: string,
    @CurrentUser() user: any,
  ) {
    return this.attendance.forCourse(courseId, date, user);
  }

  @Post('mark')
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  async mark(@Body() body: any, @CurrentUser() user: any) {
    return this.attendance.mark(body, user);
  }

  @Post('mark-all')
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  async markAll(@Body() body: any, @CurrentUser() user: any) {
    return this.attendance.markAll(body, user);
  }
}
