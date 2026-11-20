import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbot: ChatbotService) {}

  @Public()
  @Post('message')
  async message(@Body() body: { message?: string; path?: string }) {
    return this.chatbot.reply(body);
  }

  @Post('escalate')
  @UseGuards(JwtAuthGuard)
  async escalate(
    @Body() body: { message?: string; subject?: string },
    @CurrentUser() user: any,
  ) {
    return this.chatbot.escalate(user, body);
  }
}
