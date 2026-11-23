import {
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { isObservable, lastValueFrom } from 'rxjs';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // A public route must stay reachable without a token, but when a valid
      // token IS sent we still populate request.user. Endpoints such as the
      // course detail use it to release lesson content to enrolled learners
      // while hiding it from anonymous catalogue visitors.
      const request = context.switchToHttp().getRequest();
      if (String(request?.headers?.authorization || '').startsWith('Bearer ')) {
        try {
          const result = super.canActivate(context);
          if (isObservable(result)) await lastValueFrom(result);
          else await result;
        } catch {
          // Expired/invalid token on a public route: continue anonymously.
        }
      }
      return true;
    }

    const result = super.canActivate(context);
    return isObservable(result) ? lastValueFrom(result) : Boolean(await result);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication required');
    }
    return user;
  }
}
