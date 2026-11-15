import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { ActivityService } from './activity.service';

const VERB: Record<string, string> = {
  POST: 'created',
  PUT: 'updated',
  PATCH: 'updated',
  DELETE: 'deleted',
};

const ENTITY_LABEL: Record<string, string> = {
  users: 'user',
  courses: 'course',
  modules: 'module',
  lessons: 'lesson',
  enrollments: 'enrollment',
  payments: 'payment',
  assignments: 'assignment',
  submissions: 'submission',
  attendance: 'attendance',
  mentors: 'mentor profile',
  blog: 'blog post',
  jobs: 'job',
  talent: 'talent profile',
  support: 'support ticket',
  invitations: 'invitation',
  media: 'media file',
  certificates: 'certificate',
  calendar: 'live session',
  auth: 'account',
};

/**
 * Records every successful write request so admins have a complete audit
 * trail. Reads are intentionally skipped to keep the log useful and small.
 */
@Injectable()
export class ActivityInterceptor implements NestInterceptor {
  constructor(private readonly activity: ActivityService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = String(request.method || '').toUpperCase();
    const verb = VERB[method];

    if (!verb || !request.user) return next.handle();

    const rawPath = String(request.originalUrl || request.url || '');
    // Auth writes are captured explicitly by the auth service (login, register,
    // password reset) so passwords and tokens never enter the audit trail.
    if (rawPath.includes('/auth/')) return next.handle();
    // Skip noisy/heartbeat endpoints.
    if (rawPath.includes('/notifications/') && method === 'PATCH') {
      // Still useful, but these fire often; keep them but flag entity.
    }

    const cleanPath = rawPath.split('?')[0].replace(/^\/api/, '');
    const segments = cleanPath.split('/').filter(Boolean);
    const entitySegment = segments[0] || 'system';
    const entityType =
      ENTITY_LABEL[entitySegment] || entitySegment.replace(/s$/, '');
    const entityId = request.params?.id || request.params?.courseId || undefined;

    return next.handle().pipe(
      tap((body: any) => {
        const data = body?.data !== undefined ? body.data : body;
        const resolvedId =
          entityId ||
          (data && typeof data === 'object' ? data.id : undefined) ||
          undefined;
        const actorLabel = request.user?.firstName
          ? `${request.user.firstName} ${request.user.lastName || ''}`.trim()
          : 'Someone';

        this.activity.log({
          actor: request.user,
          action: `${entitySegment}.${verb}`,
          description: `${actorLabel} ${verb} ${entityType}${
            segments.length > 1 && segments[1] !== entityId ? ` (${segments.slice(1, 3).join('/')})` : ''
          }`,
          method,
          path: cleanPath,
          entityType,
          entityId: resolvedId,
          statusCode: context.switchToHttp().getResponse()?.statusCode,
          ip: request.ip,
          metadata: {
            params: request.params,
            query: request.query,
            body: method === 'DELETE' ? undefined : request.body,
          },
        });
      }),
    );
  }
}
