import {
  ExecutionContext,
  Injectable,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { Role } from '@prisma/client';

@Injectable()
export class RolesGuard {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles && !requiredPermissions) {
      return true;
    }

    const user = context.switchToHttp().getRequest().user;
    if (!user) {
      throw new ForbiddenException('Access denied');
    }

    // SUPERADMIN bypasses every check.
    if (user.role === Role.SUPERADMIN) {
      return true;
    }

    if (requiredRoles) {
      const hasRole = requiredRoles.some((role) => user.role === role);
      if (!hasRole) {
        throw new ForbiddenException(
          `Insufficient permissions. Required role: ${requiredRoles.join(', ')}`,
        );
      }
    }

    if (requiredPermissions) {
      const granted: string[] = user.permissions || [];
      const hasAll = requiredPermissions.every((p) => granted.includes(p));
      if (!hasAll) {
        throw new ForbiddenException(
          `Insufficient permissions. Required: ${requiredPermissions.join(', ')}`,
        );
      }
    }

    return true;
  }
}
