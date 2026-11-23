import React, { useEffect, useState } from 'react';
import { normalizeImageUrl } from '../../lib/image';
import { readToken } from '../../lib/token';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  Award,
  BookOpen,
  Briefcase,
  CalendarCheck,
  ChevronDown,
  ClipboardList,
  CreditCard,
  ExternalLink,
  GraduationCap,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  MessageSquare,
  MessageSquareQuote,
  Newspaper,
  User,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../AuthContext';
import ThemeToggle from '../ThemeToggle';

const items = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true, permission: null },
  { to: '/admin/users', label: 'Users & Roles', icon: Users, permission: 'MANAGE_USERS' },
  { to: '/admin/courses', label: 'Courses', icon: BookOpen, permission: 'MANAGE_COURSES' },
  {
    to: '/admin/assignments',
    label: 'Assignments',
    icon: Award,
    permission: 'MANAGE_COURSES',
  },
  {
    to: '/admin/quizzes',
    label: 'Quizzes',
    icon: ClipboardList,
    permission: 'MANAGE_COURSES',
  },
  {
    to: '/admin/testimonials',
    label: 'Testimonies',
    icon: MessageSquareQuote,
    permission: 'MANAGE_COURSES',
  },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard, permission: 'MANAGE_PAYMENTS' },
  { to: '/admin/attendance', label: 'Attendance', icon: CalendarCheck, permission: 'MANAGE_COURSES' },
  { to: '/admin/activity', label: 'Activity log', icon: Activity, adminOnly: true },
  { to: '/admin/talent', label: 'Talent Hub', icon: Users, permission: 'MANAGE_TALENT' },
  { to: '/admin/mentors', label: 'Mentors', icon: GraduationCap, permission: 'MANAGE_TALENT' },
  { to: '/admin/blog', label: 'Blog', icon: Newspaper, permission: 'MANAGE_BLOG' },
  { to: '/admin/jobs', label: 'Jobs', icon: Briefcase, permission: 'MANAGE_JOBS' },
  { to: '/admin/support', label: 'Support', icon: LifeBuoy, permission: 'MANAGE_SUPPORT' },
  { to: '/messages', label: 'Support chat', icon: MessageSquare, permission: 'MANAGE_SUPPORT' },
];

// Compact collapsible groups — one row each until expanded.
const NAV_GROUPS = [
  {
    label: 'Learning',
    icon: BookOpen,
    paths: ['/admin/courses', '/admin/assignments', '/admin/quizzes', '/admin/attendance', '/admin/testimonials'],
  },
  { label: 'People', icon: Users, paths: ['/admin/users', '/admin/talent', '/admin/mentors'] },
  { label: 'Finance', icon: CreditCard, paths: ['/admin/payments'] },
  { label: 'Insights', icon: Activity, paths: ['/admin/activity'] },
  { label: 'Content', icon: Newspaper, paths: ['/admin/blog', '/admin/jobs'] },
  {
    label: 'Support',
    icon: LifeBuoy,
    paths: ['/admin/support', '/messages'],
  },
];

const AdminLayout = () => {
  const { user, logout, hasPermission, isSuperAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState(() => {
    const path = window.location.pathname;
    const activeGroup = NAV_GROUPS.find((group) =>
      group.paths.some((item) => path.startsWith(item)),
    );
    return activeGroup ? { [activeGroup.label]: true } : {};
  });
  const [awaiting, setAwaiting] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isSuperAdmin && !hasPermission('MANAGE_PAYMENTS')) return undefined;
    let cancelled = false;
    const load = () => {
      const token = readToken();
      fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/payments?status=AWAITING_APPROVAL&limit=1`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      )
        .then((res) => (res.ok ? res.json() : null))
        .then((body) => {
          if (!cancelled && body?.data?.meta) setAwaiting(body.data.awaiting || 0);
        })
        .catch(() => undefined);
    };
    load();
    const interval = setInterval(load, 60_000);
    const onPaymentActivity = () => load();
    window.addEventListener('tweack:payment-activity', onPaymentActivity);
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener('tweack:payment-activity', onPaymentActivity);
    };
  }, [hasPermission, isSuperAdmin]);

  const visible = items.filter((item) => {
    if (item.adminOnly) {
      return isSuperAdmin || user?.role === 'ADMIN';
    }
    if (!item.permission) return true;
    return isSuperAdmin || hasPermission(item.permission);
  });

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const Sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 border-b border-slate-200 px-5 dark:border-slate-800">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-red-500 to-red-700 text-white">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
            Tweack<span className="text-red-600 dark:text-red-500">Tech</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="ml-auto rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="px-4 py-5">
        <p className="px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Administration
        </p>
        <nav className="mt-2 space-y-1">
          {(() => {
            const linkClass = ({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                isActive
                  ? 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`;
            const renderLink = ({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={linkClass}>
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{label}</span>
                {to === '/admin/payments' && awaiting > 0 && (
                  <span className="ml-auto rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {awaiting}
                  </span>
                )}
              </NavLink>
            );

            const overview = visible.find((item) => item.to === '/admin');
            return (
              <>
                {overview && renderLink(overview)}
                {NAV_GROUPS.map((group) => {
                  const groupItems = visible.filter((item) => group.paths.includes(item.to));
                  if (!groupItems.length) return null;
                  const open = Boolean(openGroups[group.label]);
                  const active = groupItems.some((item) =>
                    window.location.pathname.startsWith(item.to),
                  );
                  return (
                    <div key={group.label}>
                      <button
                        type="button"
                        onClick={() =>
                          setOpenGroups((prev) => ({ ...prev, [group.label]: !prev[group.label] }))
                        }
                        aria-expanded={open}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                          active && !open
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                        }`}
                      >
                        <group.icon className="h-4 w-4 shrink-0" />
                        <span>{group.label}</span>
                        <ChevronDown
                          className={`ml-auto h-3.5 w-3.5 transition-transform ${
                            open ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {open && (
                        <div className="ml-4 space-y-0.5 border-l border-slate-200 pl-2 dark:border-slate-700">
                          {groupItems.map(renderLink)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            );
          })()}
        </nav>
      </div>

      <div className="mt-auto space-y-1 border-t border-slate-200 p-4 dark:border-slate-800">
        <Link to="/profile" className="nav-link w-full">
          <User className="h-4 w-4" /> My profile
        </Link>
        <Link to="/student-dashboard" className="nav-link w-full">
          <LayoutDashboard className="h-4 w-4" /> Student dashboard
        </Link>
        <Link to="/" className="nav-link w-full">
          <ExternalLink className="h-4 w-4" /> Back to site
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="nav-link w-full text-red-600 dark:text-red-400"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:block">
        {Sidebar}
      </aside>

      {/* Mobile sidebar */}
      {open && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            {Sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 sm:px-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {user?.role}
              {user?.permissions?.length
                ? ` · ${user.permissions.length} granted permission${user.permissions.length > 1 ? 's' : ''}`
                : ''}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle compact />
            {user?.avatar ? (
              <img src={normalizeImageUrl(user.avatar)} alt="" className="h-8 w-8 rounded-lg object-cover" />
            ) : (
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-red-100 text-xs font-bold text-red-700 dark:bg-red-950/60 dark:text-red-400">
                {`${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}` || 'A'}
              </span>
            )}
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
