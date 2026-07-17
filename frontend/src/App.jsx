import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoadingSpinner from './components/common/LoadingSpinner';
import './index.css';
import { useTranslation } from 'react-i18next';

// Lazy load all route components for code splitting
const Landing = lazy(() => import('./components/pages/Landing'));
const Login = lazy(() => import('./components/Login'));
const Register = lazy(() => import('./components/Register'));
const ForgotPassword = lazy(() => import('./components/ForgotPassword'));
const VerifyEmail = lazy(() => import('./components/VerifyEmail'));
const VerifyOTP = lazy(() => import('./components/VerifyOTP'));
const ResetPassword = lazy(() => import('./components/ResetPassword'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const Presentation = lazy(() => import('./components/pages/Presentation'));
const PresentMode = lazy(() => import('./components/pages/PresentMode'));
const JoinPresentation = lazy(() => import('./components/pages/JoinPresentation'));
const PricingPage = lazy(() => import('./components/pages/PricingPage.jsx'));
const About = lazy(() => import('./components/pages/About'));
const HowItWorks = lazy(() => import('./components/pages/HowItWorks'));
const Careers = lazy(() => import('./components/pages/Careers'));
const Contact = lazy(() => import('./components/pages/Contact'));
const PrivacyPolicy = lazy(() => import('./components/pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./components/pages/TermsOfService'));
const Testimonials = lazy(() => import('./components/pages/Testimonials'));
const Maintenance = lazy(() => import('./components/pages/Maintenance'));
const SuperAdminLayout = lazy(() => import('./components/SuperAdmin/SuperAdminLayout'));
const SuperAdminLogin = lazy(() => import('./components/SuperAdmin/pages/SuperAdminLogin'));
const DashboardPage = lazy(() => import('./components/SuperAdmin/pages/DashboardPage'));
const UsersPage = lazy(() => import('./components/SuperAdmin/pages/UsersPage'));
const AddUserPage = lazy(() => import('./components/SuperAdmin/pages/AddUserPage'));
const InstitutionsPage = lazy(() => import('./components/SuperAdmin/pages/InstitutionsPage'));
const PaymentsPage = lazy(() => import('./components/SuperAdmin/pages/PaymentsPage'));
const AnalyticsPage = lazy(() => import('./components/SuperAdmin/pages/AnalyticsPage'));
const PresentationsPage = lazy(() => import('./components/SuperAdmin/pages/PresentationsPage'));
const SystemPage = lazy(() => import('./components/SuperAdmin/pages/SystemPage'));
const ActivityPage = lazy(() => import('./components/SuperAdmin/pages/ActivityPage'));
const SettingsPage = lazy(() => import('./components/SuperAdmin/pages/SettingsPage'));
const JobsPage = lazy(() => import('./components/SuperAdmin/pages/JobsPage'));
const ApplicationsPage = lazy(() => import('./components/SuperAdmin/pages/ApplicationsPage'));
const TestimonialsPage = lazy(() => import('./components/SuperAdmin/pages/TestimonialsPage'));
const InstitutionAdmin = lazy(() => import('./components/InstitutionAdmin/InstitutionAdmin'));
const InstitutionRegister = lazy(() => import('./components/pages/InstitutionRegister'));

// Protected Route Component
function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  // Allow access if user is authenticated (Firebase) OR if they have institution admin token
  const hasInstitutionAdminToken = sessionStorage.getItem('institutionAdminToken');
  
  return (currentUser || hasInstitutionAdminToken) ? children : <Navigate to="/" replace />;
}

// Public Route Component (redirect to dashboard or previous page if already logged in)
function PublicRoute({ children }) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  const from = location.state?.from || '/dashboard';

  if (loading) {
    return <LoadingSpinner />;
  }

  return currentUser ? <Navigate to={from} replace /> : children;
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function PageTitleUpdater() {
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    const path = location.pathname;
    let title = t('page_titles.home');

    if (path === '/') {
      title = t('page_titles.home_full');
    } else if (path === '/login') {
      title = t('page_titles.login');
    } else if (path === '/register') {
      title = t('page_titles.register');
    } else if (path === '/forgot-password') {
      title = t('page_titles.forgot_password');
    } else if (path === '/verify-email') {
      title = t('page_titles.verify_email');
    } else if (path === '/verify-otp') {
      title = t('page_titles.verify_otp');
    } else if (path === '/reset-password') {
      title = t('page_titles.reset_password');
    } else if (path === '/dashboard') {
      title = t('page_titles.dashboard');
    } else if (path.startsWith('/presentation/')) {
      title = t('page_titles.editor');
    } else if (path.startsWith('/present/')) {
      title = t('page_titles.live_presentation');
    } else if (path.startsWith('/join/')) {
      title = t('page_titles.join_session');
    } else if (path === '/pricing') {
      title = t('page_titles.pricing');
    } else if (path === '/about') {
      title = t('page_titles.about');
    } else if (path === '/how-it-works') {
      title = t('page_titles.how_it_works');
    } else if (path === '/careers') {
      title = t('page_titles.careers');
    } else if (path === '/contact') {
      title = t('page_titles.contact');
    } else if (path === '/privacy-policy') {
      title = t('page_titles.privacy_policy');
    } else if (path === '/terms-of-service') {
      title = t('page_titles.terms_of_service');
    } else if (path.startsWith('/super-admin')) {
      title = t('page_titles.super_admin');
    } else if (path === '/institution-admin') {
      title = t('page_titles.institution_admin');
    }

    document.title = title;
  }, [location, t]);

  return null;
}

function App() {
  return (
    <>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <PageTitleUpdater />
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<PublicRoute> <Login /> </PublicRoute>} />
              <Route path="/register" element={<PublicRoute> <Register /> </PublicRoute>} />
              <Route path="/forgot-password" element={<PublicRoute> <ForgotPassword /> </PublicRoute>} />
              <Route path="/verify-email" element={<PublicRoute> <VerifyEmail /> </PublicRoute>} />
              <Route path="/verify-otp" element={<PublicRoute> <VerifyOTP /> </PublicRoute>} />
              <Route path="/reset-password" element={<PublicRoute> <ResetPassword /> </PublicRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute> <Dashboard /> </ProtectedRoute>} />
              <Route path="/presentation/:id" element={<ProtectedRoute> <Presentation /> </ProtectedRoute>} />
              <Route path="/present/:id" element={<ProtectedRoute> <PresentMode /> </ProtectedRoute>} />
              <Route path="/join/:code" element={<JoinPresentation />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/about" element={<About />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/testimonials" element={<ProtectedRoute> <Testimonials /> </ProtectedRoute>} />
              <Route path="/maintenance" element={<Maintenance />} />
              
              {/* Super Admin Routes */}
              <Route path="/super-admin/login" element={<SuperAdminLogin />} />
              <Route path="/super-admin" element={<SuperAdminLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="add-user" element={<AddUserPage />} />
                <Route path="institutions" element={<InstitutionsPage />} />
                <Route path="payments" element={<PaymentsPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="presentations" element={<PresentationsPage />} />
                <Route path="system" element={<SystemPage />} />
                <Route path="activity" element={<ActivityPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="testimonials" element={<TestimonialsPage />} />
                <Route path="jobs" element={<JobsPage />} />
                <Route path="applications" element={<ApplicationsPage />} />
              </Route>
              
              <Route path="/institution-admin" element={<InstitutionAdmin />} />
              <Route path="/institution/register" element={<InstitutionRegister />} />
              <Route path="/institution/register/verify" element={<InstitutionRegister />} />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 2000,
          },
          error: {
            duration: 2500,
          },
        }}
      />
    </>
  );
}

export default App;