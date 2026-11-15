import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Logger,
  ParseUUIDPipe,
} from '@nestjs/common';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('support')
@UseGuards(JwtAuthGuard)
export class SupportController {
  private readonly logger = new Logger(SupportController.name);

  constructor(private supportService: SupportService) {}

  @Post('tickets')
  async createTicket(@Body() body: any, @CurrentUser() user: any) {
    return this.supportService.createTicket(body, user.sub);
  }

  @Get('tickets/my')
  async getMyTickets(@CurrentUser() user: any, @Query() query: any) {
    return this.supportService.findMyTickets(user.sub, {
      page: query.page ? parseInt(query.page, 10) : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
    });
  }

  @Get('tickets')
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermissions('MANAGE_SUPPORT')
  async findAll(@Query() query: any) {
    return this.supportService.findAll({
      page: query.page ? parseInt(query.page, 10) : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
      status: query.status,
      priority: query.priority,
      assignedTo: query.assignedTo,
    });
  }

  @Get('tickets/:id')
  async getTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.supportService.findById(id, user.sub, user.role, user.permissions || []);
  }

  @Post('tickets/:id/reply')
  async addReply(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { message: string; isInternal?: boolean },
    @CurrentUser() user: any,
  ) {
    return this.supportService.addReply(id, body, user.sub, user.role, user.permissions || []);
  }

  @Patch('tickets/:id')
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermissions('MANAGE_SUPPORT')
  async updateTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.supportService.updateTicket(id, body, user.sub, user.role);
  }

  @Get('stats')
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermissions('MANAGE_SUPPORT')
  async getStats() {
    return this.supportService.getStats();
  }
}
