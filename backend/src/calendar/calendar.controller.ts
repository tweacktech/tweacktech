import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('calendar')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private readonly calendar: CalendarService) {}

  @Get('my')
  async myCalendar(@CurrentUser() user: any) {
    return this.calendar.myCalendar(user);
  }

  @Get('course/:courseId')
  async courseCalendar(@Param('courseId') courseId: string, @CurrentUser() user: any) {
    return this.calendar.courseCalendar(courseId, user);
  }
}
