import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AiService, TutorMode } from './ai.service';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  /** Public so the client can hide the tutor before a student signs in. */
  @Public()
  @Get('config')
  async config() {
    return { enabled: await this.ai.isTutorEnabled() };
  }

  @Patch('config')
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  async setConfig(@Body() body: { enabled?: boolean }) {
    return this.ai.setTutorEnabled(body?.enabled !== false);
  }

  @Post('tutor')
  async tutor(
    @Body() body: { lessonId?: string; question?: string; mode?: string },
  ) {
    if (!body?.lessonId) {
      return { reply: 'Open a lesson to use the AI study assistant.', mode: 'explain' };
    }
    return this.ai.tutor({
      lessonId: body.lessonId,
      question: body.question,
      mode: (body.mode || 'explain') as TutorMode,
    });
  }
}
