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

  const { login } = useAuth();

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

      // Normal user login
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

      if (error.code === 'LEGACY_PASSWORD_RESET_REQUIRED') {
        toast.error(error.message || t('login.legacy_password_reset_required'));
        navigate('/forgot-password', { state: { email: formData.email } });
        return;
      }

      let errorMessage = t('login.login_failed');

      if (error.code === 'INVALID_CREDENTIALS') {
        errorMessage = t('login.invalid_credential_details');
      } else {
        errorMessage = translateError(error, t, 'login.login_failed');
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
