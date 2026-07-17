import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { translateError } from '../utils/errorTranslator';
import api from '../config/api';
import Button from './ui/Button';
import Input from './ui/Input';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, loginWithGoogle } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // First, check if this is an institution admin email
      try {
        const checkResponse = await api.post('/institution-admin/check', {
          email: formData.email
        });

        if (checkResponse.data.success && checkResponse.data.isInstitutionAdmin) {
          // This is an institution admin - use institution admin login
          try {
            const loginResponse = await api.post('/institution-admin/login', {
              email: formData.email,
              password: formData.password
            });

            if (loginResponse.data.success && loginResponse.data.token) {
              // Store institution admin token
              sessionStorage.setItem('institutionAdminToken', loginResponse.data.token);
              toast.success(t('login.institution_admin_login_success'));
              navigate('/institution-admin');
              return;
            }
          } catch (institutionLoginError) {
            // Institution admin login failed - show error and don't try normal login
            const errorMsg = translateError(institutionLoginError, t, 'login.invalid_credential_details');
            setError(errorMsg);
            toast.error(errorMsg);
            setLoading(false);
            return;
          }
        }
      } catch (institutionError) {
        // If institution admin check fails (network error, etc.), continue to normal login
        console.log('Institution admin check failed, trying normal login...');
      }

      // Normal user login with Firebase
      await login(formData.email, formData.password);
      toast.success(t('login.login_success'));
      const from = location.state?.from || '/dashboard';
      navigate(from);
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);

      if (error.code === 'EMAIL_NOT_VERIFIED') {
        navigate('/verify-email', { state: { email: formData.email } });
        return;
      }

      // Handle Firebase errors
      let errorMessage = t('login.login_failed');

      if (error.code === 'auth/user-not-found') {
        errorMessage = t('login.user_not_found_details');
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = t('login.wrong_password_details');
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = t('login.invalid_email_details');
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = t('login.invalid_credential_details');
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = t('login.network_error');
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = t('login.too_many_requests');
      } else {
        errorMessage = translateError(error, t, 'login.login_failed');
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      await loginWithGoogle();
      toast.success(t('login.google_signin_success'));
      const from = location.state?.from || '/dashboard';
      navigate(from);
    } catch (error) {
      console.error('Google sign-in error:', error);

      let errorMessage = t('login.google_signin_failed');

      // Check for Firebase errors first
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = t('login.popup_closed');
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = t('login.popup_blocked');
      }
      // Check for server errors (from backend)
      else {
        errorMessage = translateError(error, t, 'login.google_signin_failed');
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas-soft p-5 relative overflow-hidden font-sans text-ink">
      <motion.div
        initial={{ x: -30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        className='absolute top-10 left-10 z-20 hover:cursor-pointer text-ink-secondary hover:text-ink flex gap-2 justify-center items-center bg-surface border border-hairline px-4 py-2 rounded-full shadow-[var(--shadow-level-1)] transition-colors'
        onClick={() => navigate('/')}
      >
        <ArrowLeft className='h-4 w-4' />
        <span className='text-sm font-medium'>{t('login.back_to_home')}</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="relative z-10 bg-surface border border-hairline rounded-lg shadow-[var(--shadow-level-1)] p-8 md:p-10 w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-ink mb-2">{t('login.welcome_back')}</h2>
          <p className="text-ink-muted text-sm">{t('login.sign_in_to_continue')}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xs mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <Button
          type="button"
          variant="secondary"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full mb-6"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {loading ? t('login.signing_in') : t('login.continue_with_google')}
        </Button>

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-hairline"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-surface text-ink-muted rounded-full">{t('login.or_sign_in_with_email')}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ink-secondary mb-2">
              {t('login.email_address')}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-ink-faint group-focus-within:text-primary transition-colors" />
              </div>
              <Input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={t('login.email_placeholder')}
                required
                disabled={loading}
                className="pl-10! pr-4!"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-ink-secondary mb-2">
              {t('login.password')}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-ink-faint group-focus-within:text-primary transition-colors" />
              </div>
              <Input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={t('login.password_placeholder')}
                required
                disabled={loading}
                autoComplete="new-password"
                className="pl-10! pr-12!"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center z-10"
                disabled={loading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-ink-faint hover:text-ink-secondary transition-colors cursor-pointer" />
                ) : (
                  <Eye className="h-5 w-5 text-ink-faint hover:text-ink-secondary transition-colors cursor-pointer" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <Link
              to="/forgot-password"
              className="text-sm text-primary hover:text-primary-active transition-colors"
            >
              {t('login.forgot_password')}
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="w-full mt-2"
          >
            {loading ? (
              t('login.signing_in')
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                {t('login.sign_in')}
              </>
            )}
          </Button>
        </form>

        <p className="text-center text-ink-muted text-sm mt-8">
          {t('login.dont_have_account')}{' '}
          <Link
            to="/register"
            className="text-primary font-semibold hover:text-primary-active transition-colors"
          >
            {t('login.sign_up')}
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
