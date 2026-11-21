import { Body, Controller, Post } from '@nestjs/common';
import { AiService, TutorMode } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

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
