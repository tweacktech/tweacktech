import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PaymentStatus, Role } from '@prisma/client';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { InitializePaystackDto } from './dto/initialize-paystack.dto';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('bank-transfer')
  async bankTransfer(
    @Body() body: { courseId: string; currency?: string; amount?: number },
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.createBankTransfer(user.sub, body);
  }

  @Post(':id/proof')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      // Vercel rejects request bodies above 4.5 MB, so keep proofs under 4 MB
      // to fail with a clear message instead of a platform-level 413.
      limits: { fileSize: 4 * 1024 * 1024 },
    }),
  )
  async uploadProof(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { note?: string },
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.uploadProof(id, user.sub, file, body?.note);
  }

  @Get('my')
  async myPayments(@CurrentUser() user: any, @Query() query: any) {
    return this.paymentsService.findMyPayments(user.sub, {
      page: query.page ? parseInt(query.page, 10) : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
    });
  }

  @Get('bank-accounts')
  async bankAccounts() {
    return this.paymentsService.bankAccounts();
  }

  @Post('bank-accounts')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @RequirePermissions('MANAGE_PAYMENTS')
  async createBankAccount(@Body() body: any) {
    return this.paymentsService.createBankAccount(body);
  }

  @Patch('bank-accounts/:id')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @RequirePermissions('MANAGE_PAYMENTS')
  async updateBankAccount(@Param('id') id: string, @Body() body: any) {
    return this.paymentsService.updateBankAccount(id, body);
  }

  @Delete('bank-accounts/:id')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @RequirePermissions('MANAGE_PAYMENTS')
  async removeBankAccount(@Param('id') id: string) {
    return this.paymentsService.removeBankAccount(id);
  }

  @Post('paystack/initialize')
  async initializePaystack(
    @Body() body: InitializePaystackDto,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.initializePaystack(user.sub, body);
  }

  @Post('paystack/verify')
  async verifyPaystack(@Body() body: { reference: string }, @CurrentUser() user: any) {
    return this.paymentsService.verifyPaystack(body.reference, user.sub);
  }

  @Public()
  @Post('paystack/webhook')
  async paystackWebhook(
    @Req() request: any,
    @Body() body: any,
  ) {
    return this.paymentsService.handlePaystackWebhook(
      request.rawBody,
      request.headers['x-paystack-signature'] as string,
    );
  }

  @Get('revenue/stats')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @RequirePermissions('MANAGE_PAYMENTS')
  async revenueStats() {
    return this.paymentsService.getRevenueStats();
  }

  @Get()
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermissions('MANAGE_PAYMENTS')
  async findAll(@Query() query: any) {
    return this.paymentsService.findAll({
      page: query.page ? parseInt(query.page, 10) : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
      status: query.status as PaymentStatus,
      method: query.method,
      search: query.search,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.paymentsService.findOne(id, user);
  }

  @Patch(':id/review')
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.STAFF)
  @RequirePermissions('MANAGE_PAYMENTS')
  async review(
    @Param('id') id: string,
    @Body() body: { action: 'approve' | 'reject'; note?: string },
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.review(id, user, body);
  }
}
