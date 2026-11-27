import React, { useEffect, useRef, useState } from 'react';
import { normalizeImageUrl } from '../lib/image';
import { readToken } from '../lib/token';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Award,
  BadgeCheck,
  BookOpen,
  Briefcase,
  CalendarDays,
  ChevronDown,
  CreditCard,
  Download,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Settings,
  User,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useCurrency } from '../CurrencyContext';
import ThemeToggle from './ThemeToggle';

const navLinks = [
  { to: '/courses', label: 'Courses', icon: BookOpen },
  { to: '/mentors', label: 'Mentors', icon: BadgeCheck },
  { to: '/talent', label: 'Talent Hub', icon: Users },
  { to: '/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/blog', label: 'Blog', icon: GraduationCap },
];

const Navbar = () => {
  const { user, logout, isAuthenticated, isManagement } = useAuth();
  const { currencies, selected, setCurrency } = useCurrency();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [installPrompt, setInstallPrompt] = useState(null);
  const userRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
    setUserOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handler = () => setInstallPrompt(window.deferredPrompt || true);
    window.addEventListener('pwa-install-available', handler);
    if (window.deferredPrompt) setInstallPrompt(window.deferredPrompt);
    return () => window.removeEventListener('pwa-install-available', handler);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnread(0);
      return undefined;
    }
    let cancelled = false;
    const loadUnread = () => {
      // Use the shared token reader so sessions that chose not to be remembered
      // (sessionStorage) still get unread counts.
      const token = readToken();
      if (!token) return;
      fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/chat/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((body) => {
          if (!cancelled) setUnread(body?.data?.count || 0);
        })
        .catch(() => undefined);
    };
    loadUnread();
    const interval = setInterval(loadUnread, 25_000);
    const onActivity = () => loadUnread();
    window.addEventListener('tweack:chat-activity', onActivity);
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener('tweack:chat-activity', onActivity);
    };
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const handleInstall = async () => {
    if (window.deferredPrompt) {
      window.deferredPrompt.prompt();
      try {
        await window.deferredPrompt.userChoice;
      } catch {
        /* ignore */
      }
      window.deferredPrompt = null;
      setInstallPrompt(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const initials =
    `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl">
      <div className="container-page">
        <div className="flex h-16 items-center justify-between gap-2 sm:gap-3">
          <Link to="/" className="flex items-center gap-2.5 shrink-0" aria-label="TweackTech home">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-red-500 to-red-700 text-white shadow-lg shadow-red-600/25">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="hidden text-lg font-extrabold tracking-tight text-slate-900 dark:text-white min-[360px]:inline">
              Tweack<span className="text-red-600 dark:text-red-500">Tech</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'nav-link-active' : ''}`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <select
              value={selected}
              onChange={(event) => setCurrency(event.target.value)}
              className="hidden h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 sm:block"
              aria-label="Display currency"
              title="Display prices in"
            >
              {currencies.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code}
                </option>
              ))}
            </select>
            <ThemeToggle compact />

            {isAuthenticated ? (
              <>
                <Link
                  to="/messages"
                  className="relative hidden rounded-xl border border-slate-200 p-2 text-slate-500 hover:border-red-300 hover:text-red-600 dark:border-slate-700 dark:text-slate-300 sm:inline-flex"
                  aria-label="Messages"
                  title="Messages"
                >
                  <MessageCircle className="h-4 w-4" />
                  {unread > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </Link>
                <Link
                  to="/dashboard"
                  className="hidden sm:inline-flex btn-primary !px-4 !py-2"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>

                <div className="relative" ref={userRef}>
                  <button
                    type="button"
                    onClick={() => setUserOpen((v) => !v)}
                    className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5 hover:border-red-300 dark:hover:border-red-700 transition-colors sm:gap-2 sm:pr-2"
                    aria-haspopup="menu"
                    aria-expanded={userOpen}
                  >
                    {user?.avatar ? (
                      <img
                        src={normalizeImageUrl(user.avatar)}
                        alt=""
                        className="h-7 w-7 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="grid h-7 w-7 place-items-center rounded-lg bg-red-100 dark:bg-red-950/60 text-xs font-bold text-red-700 dark:text-red-400">
                        {initials}
                      </span>
                    )}
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  </button>

                  {userOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl scale-in"
                    >
                      <div className="border-b border-slate-100 dark:border-slate-800 px-4 py-3">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {user?.email}
                        </p>
                        <span className="badge-info mt-2">{user?.role}</span>
                      </div>
                      <div className="p-1.5">
                        <Link to="/dashboard" className="nav-link w-full" role="menuitem">
                          <LayoutDashboard className="h-4 w-4" /> Dashboard
                        </Link>
                        <Link to="/assignments" className="nav-link w-full" role="menuitem">
                          <Award className="h-4 w-4" /> My Assignments
                        </Link>
                        <Link to="/messages" className="nav-link w-full" role="menuitem">
                          <MessageCircle className="h-4 w-4" /> Messages
                          {unread > 0 && (
                            <span className="ml-auto rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                              {unread}
                            </span>
                          )}
                        </Link>
                        <Link to="/calendar" className="nav-link w-full" role="menuitem">
                          <CalendarDays className="h-4 w-4" /> Calendar
                        </Link>
                        <Link to="/payments" className="nav-link w-full" role="menuitem">
                          <CreditCard className="h-4 w-4" /> Payments
                        </Link>
                        <Link to="/profile" className="nav-link w-full" role="menuitem">
                          <User className="h-4 w-4" /> Profile
                        </Link>
                        {isManagement && (
                          <Link to="/admin" className="nav-link w-full" role="menuitem">
                            <Settings className="h-4 w-4" /> Admin Panel
                          </Link>
                        )}
                        {installPrompt && (
                          <button
                            type="button"
                            onClick={handleInstall}
                            className="nav-link w-full"
                            role="menuitem"
                          >
                            <Download className="h-4 w-4" /> Install app
                          </button>
                        )}
                      </div>
                      <div className="border-t border-slate-100 dark:border-slate-800 p-1.5">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="nav-link w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                          role="menuitem"
                        >
                          <LogOut className="h-4 w-4" /> Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/login"
                  state={{ from: `${location.pathname}${location.search}` }}
                  className="btn-ghost !px-4 !py-2"
                >
                  Sign in
                </Link>
                <Link to="/register" className="btn-primary !px-4 !py-2">
                  Get started
                </Link>
              </div>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden rounded-xl p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 sm:p-2"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          <div className="container-page max-h-[calc(100vh-4rem)] overflow-y-auto py-4 space-y-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-colors ${
                    isActive
                      ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`
                }
              >
                <Icon className="h-5 w-5" /> {label}
              </NavLink>
            ))}

            <div className="mt-4 border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2">
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" className="btn-primary w-full">
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </Link>
                  <Link to="/assignments" className="btn-secondary w-full">
                    <Award className="h-4 w-4" /> My Assignments
                  </Link>
                  <Link to="/messages" className="btn-secondary w-full">
                    <MessageCircle className="h-4 w-4" /> Messages
                  </Link>
                  <Link to="/calendar" className="btn-secondary w-full">
                    <CalendarDays className="h-4 w-4" /> Calendar
                  </Link>
                  <Link to="/payments" className="btn-secondary w-full">
                    <CreditCard className="h-4 w-4" /> Payments
                  </Link>
                  {isManagement && (
                    <Link to="/admin" className="btn-secondary w-full">
                      <Settings className="h-4 w-4" /> Admin Panel
                    </Link>
                  )}
                  {installPrompt && (
                    <button type="button" onClick={handleInstall} className="btn-secondary w-full">
                      <Download className="h-4 w-4" /> Install app
                    </button>
                  )}
                  <button type="button" onClick={handleLogout} className="btn-ghost w-full text-red-600">
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    state={{ from: `${location.pathname}${location.search}` }}
                    className="btn-secondary w-full"
                  >
                    Sign in
                  </Link>
                  <Link to="/register" className="btn-primary w-full">
                    Create free account
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
