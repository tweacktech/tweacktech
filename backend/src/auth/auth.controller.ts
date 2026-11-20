import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  UseGuards,
  Logger,
  Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  ResetPasswordDto,
  UpdateProfileDto,
} from './dto';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}


  @Public()
  @Post('google')
  async google(@Body() body: { idToken?: string }) {
    return this.authService.googleLogin(body?.idToken || '');
  }

  @Public()
  @Post('register')
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Public()
  @Post('login')
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  // Must be public: the access token is usually expired when this is called.
  @Public()
  @Post('refresh')
  async refresh(@Body() body: RefreshTokenDto) {
    return this.authService.refreshToken(body.refreshToken);
  }

  @Public()
  @Post('forgot-password')
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email);
  }

  @Public()
  @Post('reset-password')
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.token, body.password);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: any) {
    return this.authService.getUserProfile(user.sub);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@CurrentUser() user: any, @Body() body: UpdateProfileDto) {
    return this.authService.updateProfile(user.sub, body);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(@CurrentUser() user: any, @Body() body: ChangePasswordDto) {
    return this.authService.changePassword(user.sub, body.currentPassword, body.newPassword);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  async getUsers(
    @Query() query: { page?: string; limit?: string; role?: string },
  ) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const where: any = {};
    if (query.role) where.role = query.role;

    const [users, total] = await this.getUsersPaginated(where, page, limit);

    return {
      users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async getUsersPaginated(
    where: any,
    page: number,
    limit: number,
  ): Promise<[any[], number]> {
    // Stub: move this into AuthService/UsersService and query Prisma there.
    return [[], 0];
  }
}
