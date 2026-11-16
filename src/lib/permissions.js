/**
 * Single source of truth for which URL requires which capability.
 * The UI uses this to hide links, and route guards use it to refuse direct
 * URL navigation. The API enforces the same rules server-side.
 */

export const ADMIN_PAGES = [
  {
    path: '/admin/users',
    permission: 'MANAGE_USERS',
    label: 'Users & Roles',
  },
  {
    path: '/admin/courses',
    permission: 'MANAGE_COURSES',
    label: 'Courses',
  },
  {
    path: '/admin/courses/:id',
    permission: 'MANAGE_COURSES',
    label: 'Course builder',
  },
  {
    path: '/admin/assignments',
    permission: 'MANAGE_COURSES',
    label: 'Assignments',
  },
  {
    path: '/admin/payments',
    permission: 'MANAGE_PAYMENTS',
    label: 'Payments',
  },
  {
    path: '/admin/talent',
    permission: 'MANAGE_TALENT',
    label: 'Talent Hub',
  },
  {
    path: '/admin/blog',
    permission: 'MANAGE_BLOG',
    label: 'Blog',
  },
  {
    path: '/admin/jobs',
    permission: 'MANAGE_JOBS',
    label: 'Jobs',
  },
  {
    path: '/admin/support',
    permission: 'MANAGE_SUPPORT',
    label: 'Support',
  },
  {
    path: '/admin/attendance',
    permission: 'MANAGE_COURSES',
    label: 'Attendance',
  },
  {
    path: '/admin/activity',
    permission: 'MANAGE_SETTINGS',
    label: 'Activity log',
  },
];

export const canAccessAdminPath = (pathname, { isSuperAdmin, hasPermission }) => {
  if (pathname === '/admin' || pathname === '/admin/') return true;
  const rule = ADMIN_PAGES.find((page) =>
    page.path.includes(':id')
      ? new RegExp(`^${page.path.replace(':id', '[^/]+')}$`).test(pathname)
      : page.path === pathname,
  );
  if (!rule) return true; // authenticated management user may see overview/unknown child
  return isSuperAdmin || hasPermission(rule.permission);
};

export const PERMISSION_LABELS = {
  MANAGE_USERS: 'Manage users & roles',
  MANAGE_COURSES: 'Manage courses, modules & lessons',
  MANAGE_STUDENTS: 'Manage students',
  MANAGE_BLOG: 'Manage blog',
  MANAGE_JOBS: 'Manage jobs',
  MANAGE_SUPPORT: 'Manage support',
  MANAGE_PAYMENTS: 'Approve payments',
  MANAGE_TALENT: 'Manage Talent Hub',
  MANAGE_CHAT: 'Manage chats',
  MANAGE_CERTIFICATES: 'Manage certificates',
  GRADE_ASSIGNMENTS: 'Grade assignments',
  MANAGE_SETTINGS: 'Manage settings',
};
