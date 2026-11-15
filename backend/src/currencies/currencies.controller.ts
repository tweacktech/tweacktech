import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrenciesService } from './currencies.service';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('currencies')
export class CurrenciesController {
  constructor(private readonly currencies: CurrenciesService) {}

  @Public()
  @Get()
  async findAll() {
    return this.currencies.findAll();
  }

  @Public()
  @Get('convert')
  async convert(
    @Query('amount') amount: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.currencies.convert(parseFloat(amount || '0'), from || 'USD', to || 'NGN');
  }

  @Patch(':code')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @RequirePermissions('MANAGE_SETTINGS')
  async update(@Param('code') code: string, @Body() body: any) {
    return this.currencies.upsert(code, body);
  }
}
