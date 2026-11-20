import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Patch,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { MentorsService } from './mentors.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('mentors')
export class MentorsController {
  constructor(private readonly mentors: MentorsService) {}

  @Public()
  @Get()
  @Header('Cache-Control', 'public, max-age=20, stale-while-revalidate=60')
  async list(@Query() query: any) {
    return this.mentors.list({
      featured: query.featured !== undefined ? query.featured === 'true' : undefined,
      search: query.search,
      skill: query.skill,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
      publishedOnly: true,
    });
  }

  @Public()
  @Get('featured')
  @Header('Cache-Control', 'public, max-age=20, stale-while-revalidate=60')
  async featured(@Query('limit') limit?: string) {
    return this.mentors.featured(limit ? parseInt(limit, 10) : undefined);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async mine(@CurrentUser() user: any) {
    return this.mentors.mine(user.sub);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  async saveMine(@CurrentUser() user: any, @Body() body: any) {
    return this.mentors.upsertMine(user, body);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  async adminList() {
    return this.mentors.adminList();
  }

  @Put('admin/:userId')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  async adminSave(
    @Param('userId') userId: string,
    @CurrentUser() user: any,
    @Body() body: any,
  ) {
    return this.mentors.upsertMine(user, body, userId);
  }

  @Patch('admin/:userId/featured')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  async setFeatured(
    @Param('userId') userId: string,
    @Body() body: { isFeatured?: boolean },
    @CurrentUser() user: any,
  ) {
    return this.mentors.setFeatured(userId, body?.isFeatured === true, user);
  }

  @Public()
  @Get(':id')
  async detail(@Param('id') id: string) {
    return this.mentors.detail(id);
  }
}
