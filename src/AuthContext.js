import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import axios from 'axios';
import { getErrorMessage, isDatabaseOffline, notifyOffline } from './lib/apiError';
import { disconnectPusher, getPusher } from './lib/pusher';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
const TOKEN_KEY = 'tweacktech-token';
const REFRESH_KEY = 'tweacktech-refresh-token';
const PROFILE_KEY = 'tweacktech-profile';

const getStore = () =>
  typeof sessionStorage !== 'undefined' && sessionStorage.getItem(TOKEN_KEY)
    ? sessionStorage
    : localStorage;

const readToken = () => getStore().getItem(TOKEN_KEY);
const readRefreshToken = () => getStore().getItem(REFRESH_KEY);

const writeTokens = (tokens, remember = true) => {
  const store = remember ? localStorage : sessionStorage;
  const other = remember ? sessionStorage : localStorage;
  other.removeItem(TOKEN_KEY);
  other.removeItem(REFRESH_KEY);
  other.removeItem(PROFILE_KEY);
  store.setItem(TOKEN_KEY, tokens.accessToken);
  store.setItem(REFRESH_KEY, tokens.refreshToken);
};

const readCachedProfile = () => {
  try {
    const raw = getStore().getItem(PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (error) {
    return null;
  }
};


const AuthContext = createContext(null);

// The backend wraps every response as { success, timestamp, path, data }.
const unwrap = (body) => (body && typeof body === 'object' && 'data' in body ? body.data : body);

// Avoid re-rendering every consumer (and re-running page loaders) when the
// heartbeat returns an identical profile.
const profileSignature = (profile) =>
  JSON.stringify({
    id: profile?.id,
    email: profile?.email,
    firstName: profile?.firstName,
    lastName: profile?.lastName,
    role: profile?.role,
    permissions: profile?.permissions,
    avatar: profile?.avatar,
    isActive: profile?.isActive,
    phone: profile?.phone,
    bio: profile?.bio,
    location: profile?.location,
    website: profile?.website,
    github: profile?.github,
    linkedin: profile?.linkedin,
    twitter: profile?.twitter,
  });

export const AuthProvider = ({ children }) => {
  // Hydrate the last known profile immediately so returning users never see a
  // full-screen loader on refresh. The token is revalidated in the background.
  const [user, setUser] = useState(() => {
    if (!readToken()) return null;
    return readCachedProfile();
  });
  const [token, setToken] = useState(() => readToken());
  const [loading, setLoading] = useState(
    () => !(readToken() && readCachedProfile()),
  );
  const [sessionNotice, setSessionNotice] = useState('');
  const heartbeatBusy = useRef(false);

  const clearSession = useCallback((notice = '') => {
    [localStorage, sessionStorage].forEach((store) => {
      store.removeItem(TOKEN_KEY);
      store.removeItem(REFRESH_KEY);
      store.removeItem(PROFILE_KEY);
    });
    setToken(null);
    setUser(null);
    disconnectPusher();
    if (notice) setSessionNotice(notice);
  }, []);

  // Keep the offline profile snapshot in sync with the live user object.
  useEffect(() => {
    if (user) {
      try {
        getStore().setItem(PROFILE_KEY, JSON.stringify(user));
      } catch (error) {
        /* storage full or unavailable — non-critical */
      }
    } else {
      getStore().removeItem(PROFILE_KEY);
    }
  }, [user]);


  const saveSession = useCallback((tokens, remember = true) => {
    writeTokens(tokens, remember);
    setToken(tokens.accessToken);
  }, []);

  // One stable axios instance. Reads the token from storage on every request,
  // so it never goes stale.
  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: API_URL,
      headers: { 'Content-Type': 'application/json' },
    });

    instance.interceptors.request.use((config) => {
      const current = readToken();
      if (current) config.headers.Authorization = `Bearer ${current}`;
      // Let the browser set the multipart boundary for file uploads.
      if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
        delete config.headers['Content-Type'];
      }
      return config;
    });

    instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const original = error.config;
        const status = error.response?.status;
        const isAuthEndpoint = original?.url?.startsWith('/auth/');

        // One quick retry for transient network/5xx failures on idempotent
        // reads. This hides Neon cold starts and brief proxy blips without
        // slowing down normal requests or touching auth endpoints.
        if (
          original &&
          !original._networkRetry &&
          !isAuthEndpoint &&
          (!status || status >= 500) &&
          String(original.method || 'get').toLowerCase() === 'get'
        ) {
          original._networkRetry = true;
          await new Promise((resolve) => setTimeout(resolve, 300));
          return instance(original);
        }

        if (isDatabaseOffline(error)) notifyOffline(error);
        const refreshToken = readRefreshToken();

        // Account disabled (or deleted): never keep a zombie session around.
        const body = error.response?.data || {};
        const inactive =
          body.code === 'ACCOUNT_DISABLED' ||
          (typeof body.message === 'string' &&
            /inactive|deactivated|disabled/i.test(body.message));

        if (status === 401 && inactive) {
          clearSession('Your account has been disabled. Contact support if you need help.');
          return Promise.reject(error);
        }

        if (status === 401 && original && !original._retry && !isAuthEndpoint && refreshToken) {
          original._retry = true;
          try {
            // Plain axios here, not `instance`, so a failed refresh can't loop.
            const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
            const tokens = unwrap(res.data);
            writeTokens(tokens, getStore() === localStorage);
            setToken(tokens.accessToken);
            original.headers.Authorization = `Bearer ${tokens.accessToken}`;
            return instance(original);
          } catch (refreshError) {
            if (!isDatabaseOffline(refreshError)) {
              clearSession('Your session ended. Please sign in again.');
            }
          }
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }, [clearSession]);

  const login = useCallback(
    async (email, password, remember = true) => {
      const res = await api.post('/auth/login', { email, password });
      const data = unwrap(res.data);
      saveSession(data.tokens, remember);
      setUser(data.user);
      setSessionNotice('');
      return data.user;
    },
    [api, saveSession]
  );

  const googleLogin = useCallback(
    async (idToken) => {
      const res = await api.post('/auth/google', { idToken });
      const data = unwrap(res.data);
      saveSession(data.tokens, true);
      setUser(data.user);
      setSessionNotice('');
      return data.user;
    },
    [api, saveSession]
  );

  // Only the fields the backend accepts. Role is always STUDENT on public signup.
  const register = useCallback(
    async ({ email, password, firstName, lastName }) => {
      const res = await api.post('/auth/register', { email, password, firstName, lastName });
      const data = unwrap(res.data);
      saveSession(data.tokens);
      setUser(data.user);
      setSessionNotice('');
      return data.user;
    },
    [api, saveSession]
  );

  const forgotPassword = useCallback(
    async (email) => {
      const res = await api.post('/auth/forgot-password', { email });
      return unwrap(res.data);
    },
    [api]
  );

  const resetPassword = useCallback(
    async (tokenValue, password) => {
      const res = await api.post('/auth/reset-password', { token: tokenValue, password });
      return unwrap(res.data);
    },
    [api]
  );

  // Protected routes redirect to /login once user is cleared.
  const logout = useCallback(() => {
    clearSession('');
    setSessionNotice('');
  }, [clearSession]);

  const refreshUser = useCallback(async () => {
    if (!readToken()) return null;
    const res = await api.get('/auth/me');
    const profile = unwrap(res.data);
    setUser(profile);
    return profile;
  }, [api]);

  // Restore the session on first load. Runs once; token is read from initial state.
  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        if (!cancelled) setUser(unwrap(res.data));
      } catch (error) {
        if (!cancelled && !isDatabaseOffline(error)) {
          clearSession('Your session ended. Please sign in again.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    restore();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Heartbeat: checks the account is still active every 10 seconds and when
   * the tab regains focus. A disabled account is signed out immediately after
   * the next check (and on any API 401).
   */
  useEffect(() => {
    if (!user || !token) return undefined;

    let cancelled = false;

    const check = async () => {
      if (cancelled || heartbeatBusy.current) return;
      heartbeatBusy.current = true;
      try {
        const res = await api.get('/auth/me');
        const profile = unwrap(res.data);
        if (!cancelled) {
          setUser((current) =>
            profileSignature(current) === profileSignature(profile)
              ? current
              : { ...current, ...profile },
          );
        }
      } catch (error) {
        if (cancelled || isDatabaseOffline(error)) return;
        if (error.response?.status === 401 || error.response?.status === 403) {
          clearSession('Your session ended or your account was disabled.');
        }
      } finally {
        heartbeatBusy.current = false;
      }
    };

    const interval = setInterval(check, 10_000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', check);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', check);
    };
  // user is intentionally represented by its id so the heartbeat interval is
    // not torn down every time the profile object is refreshed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, clearSession, token, user?.id]);

  // Pusher user channel: instant notifications, permission refreshes and
  // immediate sign-out when an admin disables the account.
  useEffect(() => {
    if (!user?.id || !token) return undefined;
    const pusher = getPusher();
    if (!pusher) return undefined;
    const channelName = `private-user-${user.id}`;
    const channel = pusher.subscribe(channelName);

    const onDisabled = (data) => {
      clearSession(
        data?.reason
          ? `Your account has been disabled. ${data.reason}`
          : 'Your account has been disabled. Contact support if you need help.',
      );
    };
    const onEnabled = () => {
      refreshUser().catch(() => undefined);
    };
    const onUpdated = () => {
      refreshUser().catch(() => undefined);
    };
    const onNotification = (data) => {
      window.dispatchEvent(new CustomEvent('tweack:notification', { detail: data }));
    };
    const onSupportUpdated = (data) => {
      window.dispatchEvent(
        new CustomEvent('tweack:notification', {
          detail: {
            id: `support-${Date.now()}`,
            title: data?.status ? `Support ticket ${data.status.toLowerCase()}` : 'Support update',
            body: 'Your support conversation has a new update.',
            link: '/support',
          },
        }),
      );
    };
    const onPaymentUpdated = (data) => {
      window.dispatchEvent(
        new CustomEvent('tweack:notification', {
          detail: {
            id: `payment-${Date.now()}`,
            title: data?.status === 'COMPLETED' ? 'Payment approved' : 'Payment updated',
            body:
              data?.status === 'COMPLETED'
                ? 'Your course access is now active.'
                : `Status: ${String(data?.status || 'updated').replace('_', ' ')}.`,
            link: '/payments',
          },
        }),
      );
    };
    const onApplicationUpdated = (data) => {
      window.dispatchEvent(
        new CustomEvent('tweack:notification', {
          detail: {
            id: `application-${Date.now()}`,
            title: 'Job application updated',
            body: `Status: ${String(data?.status || 'updated').replace('_', ' ')}.`,
            link: '/dashboard',
          },
        }),
      );
    };
    const onChatActivity = () => {
      window.dispatchEvent(new Event('tweack:chat-activity'));
    };

    channel.bind('account:disabled', onDisabled);
    channel.bind('account:enabled', onEnabled);
    channel.bind('account:updated', onUpdated);
    channel.bind('notification:new', onNotification);
    channel.bind('chat:activity', onChatActivity);
    channel.bind('chat:room', onChatActivity);
    channel.bind('support:updated', onSupportUpdated);
    channel.bind('payment:updated', onPaymentUpdated);
    channel.bind('application:updated', onApplicationUpdated);

    return () => {
      channel.unbind('account:disabled', onDisabled);
      channel.unbind('account:enabled', onEnabled);
      channel.unbind('account:updated', onUpdated);
      channel.unbind('notification:new', onNotification);
      channel.unbind('chat:activity', onChatActivity);
      channel.unbind('chat:room', onChatActivity);
      channel.unbind('support:updated', onSupportUpdated);
      channel.unbind('payment:updated', onPaymentUpdated);
      channel.unbind('application:updated', onApplicationUpdated);
      pusher.unsubscribe(channelName);
    };
  }, [clearSession, refreshUser, token, user?.id]);

  const value = {
    user,
    token,
    loading,
    sessionNotice,
    clearSessionNotice: () => setSessionNotice(''),
    login,
    register,
    googleLogin,
    logout,
    refreshUser,
    forgotPassword,
    resetPassword,
    api,
    isAuthenticated: Boolean(user && token),
    permissions: user?.permissions || [],
    hasPermission: (permission) =>
      user?.role === 'SUPERADMIN' || (user?.permissions || []).includes(permission),
    isAdmin: user?.role === 'ADMIN' || user?.role === 'SUPERADMIN',
    isStaff: user?.role === 'STAFF' || user?.role === 'ADMIN' || user?.role === 'SUPERADMIN',
    isInstructor: user?.role === 'STAFF' || user?.role === 'ADMIN' || user?.role === 'SUPERADMIN',
    isSuperAdmin: user?.role === 'SUPERADMIN',
    isManagement:
      user?.role === 'SUPERADMIN' ||
      user?.role === 'ADMIN' ||
      (user?.permissions || []).length > 0,
    getErrorMessage,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
