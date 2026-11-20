import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { TalentService } from './talent.service';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('talent')
export class TalentController {
  constructor(private readonly talent: TalentService) {}

  @Public()
  @Get()
  @Header('Cache-Control', 'public, max-age=20, stale-while-revalidate=60')
  async findAll(@Query() query: any) {
    return this.talent.findAll({
      page: query.page ? parseInt(query.page, 10) : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
      search: query.search,
      skill: query.skill,
      availability: query.availability,
      featured:
        query.featured !== undefined ? query.featured === 'true' : undefined,
      publishedOnly: true,
    });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async mine(@CurrentUser() user: any) {
    return this.talent.findMine(user.sub);
  }

  @Post('me')
  @UseGuards(JwtAuthGuard)
  async saveMine(@CurrentUser() user: any, @Body() body: any) {
    return this.talent.upsertMine(user, body);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermissions('MANAGE_TALENT')
  async findAllAdmin(@Query() query: any) {
    return this.talent.findAll({
      page: query.page ? parseInt(query.page, 10) : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
      search: query.search,
      availability: query.availability,
      publishedOnly: false,
    });
  }

  @Public()
  @Get(':id')
  @Header('Cache-Control', 'public, max-age=20, stale-while-revalidate=60')
  async findOne(@Param('id') id: string) {
    return this.talent.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermissions('MANAGE_TALENT')
  async create(@Body() body: any) {
    return this.talent.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermissions('MANAGE_TALENT')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.talent.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @RequirePermissions('MANAGE_TALENT')
  async remove(@Param('id') id: string) {
    return this.talent.remove(id);
  }
}
