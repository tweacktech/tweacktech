import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { TestimonialsService } from './testimonials.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('testimonials')
@UseGuards(JwtAuthGuard)
export class TestimonialsController {
  constructor(private readonly service: TestimonialsService) {}

  @Public()
  @Get()
  async visible(@Query('limit') limit?: string) {
    return this.service.visible(limit ? parseInt(limit, 10) : 20);
  }

  @Get('mine')
  async mine(@CurrentUser() user: any) {
    return this.service.mine(user.sub);
  }

  @Post()
  async create(@Body() body: any, @CurrentUser() user: any) {
    return this.service.create(user, body);
  }

  @Get('all')
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  async all() {
    return this.service.all();
  }

  @Patch(':id/visibility')
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  async visibility(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { isVisible?: boolean; isFeatured?: boolean },
  ) {
    const result = await this.service.setVisibility(
      id,
      body?.isVisible !== false,
      body?.isFeatured === true,
    );
    return { testimonial: result };
  }

  @Delete(':id')
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.remove(id);
    return { success: true };
  }
}
