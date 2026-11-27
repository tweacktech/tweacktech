import React, { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "./ThemeContext";
import { AuthProvider, useAuth } from "./AuthContext";
import { CurrencyProvider } from "./CurrencyContext";
import Loader from "./Component/Loader";
import ErrorBoundary from "./Component/ErrorBoundary";
import OfflineBanner from "./Component/OfflineBanner";
import ConsentBanner from "./Component/ConsentBanner";
import AdSenseLoader from "./Component/AdSenseLoader";
import SupportChatbot from "./Component/SupportChatbot";
import NotificationToast from "./Component/NotificationToast";
import { canAccessAdminPath } from "./lib/permissions";

// Public pages
const LandingPage = lazy(() => import("./Pages/LandingPage"));
const CourseCatalog = lazy(() => import("./Pages/CourseCatalog"));
const CourseDetail = lazy(() => import("./Pages/CourseDetail"));
const CoursePlayer = lazy(() => import("./Pages/CoursePlayer"));
const Dashboard = lazy(() => import("./Pages/Dashboard"));
const StaffDashboard = lazy(() => import("./Pages/StaffDashboard"));
const TalentHub = lazy(() => import("./Pages/TalentHub"));
const MentorsPage = lazy(() => import("./Pages/MentorsPage"));
const MentorDetail = lazy(() => import("./Pages/MentorDetail"));
const TalentDetail = lazy(() => import("./Pages/TalentDetail"));
const JobListings = lazy(() => import("./Pages/JobListings"));
const JobDetail = lazy(() => import("./Pages/JobDetail"));
const Assignments = lazy(() => import("./Pages/Assignments"));
const LoginPage = lazy(() => import("./Pages/LoginPage"));
const RegisterPage = lazy(() => import("./Pages/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("./Pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./Pages/ResetPasswordPage"));
const NotFound = lazy(() => import("./Pages/NotFound"));
const BlogList = lazy(() => import("./Pages/BlogList"));
const BlogDetail = lazy(() => import("./Pages/BlogDetail"));
const SupportPage = lazy(() => import("./Pages/SupportPage"));
const PrivacyPage = lazy(() => import("./Pages/PrivacyPage"));
const TermsPage = lazy(() => import("./Pages/TermsPage"));
const CookiePolicyPage = lazy(() => import("./Pages/CookiePolicyPage"));
const AboutPage = lazy(() => import("./Pages/AboutPage"));
const ContactPage = lazy(() => import("./Pages/ContactPage"));
const FAQPage = lazy(() => import("./Pages/FAQPage"));
const SpeedTypingTest = lazy(() => import("./Pages/SpeedTypingTest"));
const IdePage = lazy(() => import("./Pages/IdePage"));
const ProfilePage = lazy(() => import("./Pages/ProfilePage"));
const Messages = lazy(() => import("./Pages/Messages"));
const CalendarPage = lazy(() => import("./Pages/Calendar"));
const Payments = lazy(() => import("./Pages/Payments"));
const PaymentCallback = lazy(() => import("./Pages/PaymentCallback"));
const VerifyCertificate = lazy(() => import("./Pages/VerifyCertificate"));

// Admin pages
const AdminLayout = lazy(() => import("./Component/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./Pages/admin/AdminDashboard"));
const AdminActivity = lazy(() => import("./Pages/admin/AdminActivity"));
const AdminMentors = lazy(() => import("./Pages/admin/AdminMentors"));
const AdminAttendance = lazy(() => import("./Pages/admin/AdminAttendance"));
const AdminUsers = lazy(() => import("./Pages/admin/AdminUsers"));
const AdminCourses = lazy(() => import("./Pages/admin/AdminCourses"));
const AdminCourseBuilder = lazy(() => import("./Pages/admin/AdminCourseBuilder"));
const AdminAssignments = lazy(() => import("./Pages/admin/AdminAssignments"));
const AdminQuizzes = lazy(() => import("./Pages/admin/AdminQuizzes"));
const Testimonials = lazy(() => import("./Pages/Testimonials"));
const AdminTestimonials = lazy(() => import("./Pages/admin/AdminTestimonials"));
const AdminBlog = lazy(() => import("./Pages/admin/AdminBlog"));
const AdminJobs = lazy(() => import("./Pages/admin/AdminJobs"));
const AdminSupport = lazy(() => import("./Pages/admin/AdminSupport"));
const AdminPayments = lazy(() => import("./Pages/admin/AdminPayments"));
const AdminTalent = lazy(() => import("./Pages/admin/AdminTalent"));

// Chunks worth warming once the app is idle. Navigation to these pages then
// feels instant instead of waiting on a network round-trip.
const PREFETCH_ROUTES = [
  { path: "/courses/", load: () => import("./Pages/CourseDetail") },
  { path: "/courses", load: () => import("./Pages/CourseCatalog") },
  { path: "/dashboard", load: () => import("./Pages/Dashboard") },
  { path: "/talent", load: () => import("./Pages/TalentHub") },
  { path: "/jobs", load: () => import("./Pages/JobListings") },
  { path: "/login", load: () => import("./Pages/LoginPage") },
];


// Only for signed-out visitors (login, register). Signed-in users go to the dashboard.
const GuestOnly = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
};

// Requires a session. Remembers where the user was trying to go.
const RequireAuth = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
};

// Any management role (superadmin, admin) or a user granted permissions.
const RequireManagement = ({ children }) => {
  const { isAuthenticated, isManagement } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (!isManagement) return <Navigate to="/dashboard" replace />;
  return children;
};

// A specific capability is required for this section. Superadmins always pass.
const RequirePermission = ({ permission, children }) => {
  const { isAuthenticated, isManagement, hasPermission } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (!isManagement) return <Navigate to="/dashboard" replace />;
  if (!hasPermission(permission)) return <Navigate to="/dashboard" replace />;
  return children;
};

/**
 * Refuses direct URL access to admin screens the user has no capability for.
 * This complements the sidebar filtering — a user typing /admin/payments will
 * be sent back to the dashboard if they cannot approve payments.
 */
const RequireAdminPage = ({ children }) => {
  const { isAuthenticated, isManagement, isSuperAdmin, hasPermission } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (!isManagement) return <Navigate to="/dashboard" replace />;
  if (!canAccessAdminPath(location.pathname, { isSuperAdmin, hasPermission })) {
    return <Navigate to="/admin" replace />;
  }
  return children;
};

// Students see their own learning dashboard; staff see only assigned teaching
// work; admins are sent to the management overview.
const DashboardRoute = () => {
  const { user } = useAuth();
  if (user?.role === 'STAFF') return <StaffDashboard />;
  if (user?.role === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }
  // SUPERADMIN (and students) can open the learner dashboard directly.
  return <Dashboard />;
};

// Navigating to the next lesson (or any page) should start at the top.
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
    <Loader />
  </div>
);

function AppRoutes() {
  const { loading } = useAuth();

  // Warm a route only when the visitor shows intent (hover or keyboard focus).
  // Prefetching on page load downloads chunks that Lighthouse correctly reports
  // as unused JavaScript on the landing page and creates long main-thread tasks.
  useEffect(() => {
    const warmed = new Set();
    const warm = (event) => {
      const link = event.target?.closest?.("a[href]");
      if (!link) return;
      let path;
      try {
        path = new URL(link.href, window.location.href).pathname;
      } catch {
        return;
      }
      const route = PREFETCH_ROUTES.find((item) => path.startsWith(item.path));
      if (!route || warmed.has(route.path)) return;
      warmed.add(route.path);
      route.load().catch(() => undefined);
    };
    document.addEventListener("pointerover", warm, { passive: true });
    document.addEventListener("focusin", warm);
    return () => {
      document.removeEventListener("pointerover", warm);
      document.removeEventListener("focusin", warm);
    };
  }, []);

  // Mount consent during auth restore too, so first-time visitors always see
  // the notice instead of only a full-screen loader.
  if (loading) {
    return (
      <BrowserRouter>
        <ConsentBanner />
        <PageLoader />
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <ScrollToTop />
      <OfflineBanner />
      <ConsentBanner />
      <AdSenseLoader />
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/courses" element={<CourseCatalog />} />
            <Route path="/courses/:courseId" element={<CourseDetail />} />
            <Route path="/courses/:courseId/lessons/:lessonId" element={<CoursePlayer />} />
            <Route path="/talent" element={<TalentHub />} />
            <Route path="/mentors" element={<MentorsPage />} />
            <Route path="/mentors/:id" element={<MentorDetail />} />
            <Route path="/talent/:id" element={<TalentDetail />} />
            <Route path="/jobs" element={<JobListings />} />
            <Route path="/jobs/:jobId" element={<JobDetail />} />
            <Route path="/testimonials" element={<Testimonials />} />
            <Route path="/blog" element={<BlogList />} />
            <Route path="/blog/:slug" element={<BlogDetail />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/typing" element={<SpeedTypingTest />} />
            <Route path="/ide" element={<IdePage />} />
            <Route path="/playground" element={<IdePage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/cookies" element={<CookiePolicyPage />} />
            <Route path="/verify/:code" element={<VerifyCertificate />} />

            {/* Auth */}
            <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
            <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />
            <Route path="/forgot-password" element={<GuestOnly><ForgotPasswordPage /></GuestOnly>} />
            {/* Reset is open to everyone: the emailed link works signed in or out */}
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Signed-in student area */}
            <Route path="/dashboard" element={<RequireAuth><DashboardRoute /></RequireAuth>} />
            <Route path="/student-dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
            <Route path="/assignments" element={<RequireAuth><Assignments /></RequireAuth>} />
            <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
            <Route path="/messages" element={<RequireAuth><Messages /></RequireAuth>} />
            <Route path="/calendar" element={<RequireAuth><CalendarPage /></RequireAuth>} />
            <Route path="/payments" element={<RequireAuth><Payments /></RequireAuth>} />
            <Route path="/payments/callback" element={<RequireAuth><PaymentCallback /></RequireAuth>} />

            {/* Management panel */}
            <Route
              path="/admin"
              element={
                <RequireManagement>
                  <AdminLayout />
                </RequireManagement>
              }
            >
              <Route
                index
                element={
                  <RequireAdminPage>
                    <AdminDashboard />
                  </RequireAdminPage>
                }
              />
              <Route
                path="users"
                element={
                  <RequirePermission permission="MANAGE_USERS">
                    <AdminUsers />
                  </RequirePermission>
                }
              />
              <Route
                path="courses"
                element={
                  <RequirePermission permission="MANAGE_COURSES">
                    <AdminCourses />
                  </RequirePermission>
                }
              />
              <Route
                path="courses/:id"
                element={
                  <RequirePermission permission="MANAGE_COURSES">
                    <AdminCourseBuilder />
                  </RequirePermission>
                }
              />
              <Route
                path="assignments"
                element={
                  <RequirePermission permission="MANAGE_COURSES">
                    <AdminAssignments />
                  </RequirePermission>
                }
              />
              <Route
                path="quizzes"
                element={
                  <RequirePermission permission="MANAGE_COURSES">
                    <AdminQuizzes />
                  </RequirePermission>
                }
              />
              <Route
                path="testimonials"
                element={
                  <RequirePermission permission="MANAGE_COURSES">
                    <AdminTestimonials />
                  </RequirePermission>
                }
              />
              <Route
                path="payments"
                element={
                  <RequirePermission permission="MANAGE_PAYMENTS">
                    <AdminPayments />
                  </RequirePermission>
                }
              />
              <Route
                path="talent"
                element={
                  <RequirePermission permission="MANAGE_TALENT">
                    <AdminTalent />
                  </RequirePermission>
                }
              />
              <Route
                path="blog"
                element={
                  <RequirePermission permission="MANAGE_BLOG">
                    <AdminBlog />
                  </RequirePermission>
                }
              />
              <Route
                path="jobs"
                element={
                  <RequirePermission permission="MANAGE_JOBS">
                    <AdminJobs />
                  </RequirePermission>
                }
              />
              <Route
                path="support"
                element={
                  <RequirePermission permission="MANAGE_SUPPORT">
                    <AdminSupport />
                  </RequirePermission>
                }
              />
              <Route
                path="attendance"
                element={
                  <RequireAdminPage>
                    <AdminAttendance />
                  </RequireAdminPage>
                }
              />
              <Route
                path="activity"
                element={
                  <RequireAdminPage>
                    <AdminActivity />
                  </RequireAdminPage>
                }
              />
              <Route
                path="mentors"
                element={
                  <RequirePermission permission="MANAGE_TALENT">
                    <AdminMentors />
                  </RequirePermission>
                }
              />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
      <SupportChatbot />
      <NotificationToast />
    </BrowserRouter>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CurrencyProvider>
          <AppRoutes />
        </CurrencyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
