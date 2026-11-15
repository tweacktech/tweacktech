import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { CertificatesService } from './certificates.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('certificates')
@UseGuards(JwtAuthGuard)
export class CertificatesController {
  constructor(private certificatesService: CertificatesService) {}

  @Post('generate/:enrollmentId')
  async generate(
    @Param('enrollmentId', ParseUUIDPipe) enrollmentId: string,
    @CurrentUser() user: any,
  ) {
    return this.certificatesService.generateCertificate(
      enrollmentId,
      user.sub,
      user.role,
    );
  }

  @Get('my')
  async getMyCertificates(@CurrentUser() user: any) {
    return this.certificatesService.findMyCertificates(user.sub);
  }

  @Public()
  @Get('verify/:code')
  async verify(@Param('code') code: string) {
    return this.certificatesService.verify(code);
  }

  @Get(':id')
  async getCertificate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.certificatesService.findById(id, user.sub, user.role);
  }

  @Get()
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  async findAll(@Query() query: any) {
    return this.certificatesService.findAll({
      page: query.page ? parseInt(query.page, 10) : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
      courseId: query.courseId,
      userId: query.userId,
    });
  }
}
