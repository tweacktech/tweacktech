import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Capabilities granted by a SUPERADMIN on top of the user's base role.
 * Example: a STAFF member granted MANAGE_JOBS can manage the job board.
 */
export type Permission =
  | 'MANAGE_COURSES'
  | 'MANAGE_STUDENTS'
  | 'MANAGE_BLOG'
  | 'MANAGE_JOBS'
  | 'MANAGE_SUPPORT'
  | 'MANAGE_PAYMENTS'
  | 'MANAGE_TALENT'
  | 'MANAGE_CHAT'
  | 'MANAGE_CERTIFICATES'
  | 'GRADE_ASSIGNMENTS'
  | 'MANAGE_USERS'
  | 'MANAGE_SETTINGS';

export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
