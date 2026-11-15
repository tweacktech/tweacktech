import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Patch,
  Post,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @RequirePermissions('MANAGE_USERS')
  async findAll(@Query() query: any) {
    return this.usersService.findAll({
      page: query.page ? parseInt(query.page, 10) : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
      role: query.role,
      search: query.search,
    });
  }

  @Post()
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @RequirePermissions('MANAGE_USERS')
  async create(@Body() body: any, @CurrentUser() user: any) {
    // Admins with MANAGE_USERS may onboard students and staff, but only a
    // superadmin can mint another admin (prevents privilege escalation).
    if (user?.role !== Role.SUPERADMIN) {
      const requested = body?.role || Role.STUDENT;
      if (requested !== Role.STUDENT && requested !== Role.STAFF) {
        throw new ForbiddenException(
          'Only a superadmin can create admin accounts',
        );
      }
      body = { ...body, permissions: [] };
    }
    return this.usersService.create(body);
  }

  @Get('dashboard/me')
  async getMyDashboard(@CurrentUser() user: any) {
    if (user.role === Role.STUDENT) {
      return this.usersService.getStudentDashboard(user.sub);
    }
    if (user.role === Role.STAFF || user.role === Role.ADMIN) {
      return this.usersService.getStaffDashboard(user.sub);
    }
    return {};
  }

  @Get('instructors')
  async getInstructors() {
    return this.usersService.getInstructors();
  }

  @Patch('profile/me')
  async updateProfile(@CurrentUser() user: any, @Body() body: any) {
    return this.usersService.updateProfile(user.sub, body);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id/role')
  @Roles(Role.SUPERADMIN)
  async updateRole(@Param('id') id: string, @Body() body: { role: Role }) {
    return this.usersService.updateRole(id, body.role);
  }

  @Patch(':id/permissions')
  @Roles(Role.SUPERADMIN)
  async updatePermissions(
    @Param('id') id: string,
    @Body() body: { permissions: string[] },
  ) {
    return this.usersService.updatePermissions(id, body.permissions);
  }

  @Patch(':id/toggle-active')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @RequirePermissions('MANAGE_USERS')
  async toggleActive(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @CurrentUser() user: any,
  ) {
    return this.usersService.toggleActive(id, user, body?.reason);
  }
}
