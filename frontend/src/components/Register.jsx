import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, Lock, User, Eye, EyeOff, UserPlus, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion'; // eslint-disable-line
import { useTranslation } from 'react-i18next';
import { translateError } from '../utils/errorTranslator';
import Button from './ui/Button';
import Input from './ui/Input';

const Register = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, loginWithGoogle } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password.length < 6) {
      const errorMsg = t('register.password_min_length');
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (!formData.displayName.trim()) {
      const errorMsg = t('register.display_name_required');
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setLoading(true);

    try {
      await register(formData.email, formData.password, formData.displayName);
      toast.success(t('register.account_created_success'));
      navigate('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);

      // Account was created and the verification email was sent, but the
      // backend won't issue a session until the email is verified
      if (error.code === 'EMAIL_NOT_VERIFIED') {
        toast.success(t('register.verification_email_sent'));
        navigate('/verify-email', { state: { email: formData.email } });
        return;
      }

      // Handling Firebase errors
      let errorMessage = t('register.registration_failed');

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = t('register.email_already_in_use');
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = t('register.invalid_email');
      } else if (error.code === 'auth/weak-password') {
        errorMessage = t('register.password_too_weak');
      } else {
        errorMessage = translateError(error, t, 'register.registration_failed');
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
      toast.success(t('register.google_signup_success'));
      navigate('/dashboard');
    } catch (error) {
      console.error('Google sign-in error:', error);

      let errorMessage = t('register.google_signin_failed');

      // Check for Firebase errors
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = t('register.popup_closed');
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = t('register.popup_blocked');
      }
      // Check for server errors (from backend)
      else {
        errorMessage = translateError(error, t, 'register.google_signin_failed');
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
        className='absolute top-10 max-sm:top-5 left-10 max-sm:left-5 z-20 hover:cursor-pointer text-ink-secondary hover:text-ink flex gap-2 justify-center items-center bg-surface border border-hairline px-4 py-2 rounded-full shadow-[var(--shadow-level-1)] transition-colors'
        onClick={() => navigate('/')}
      >
        <ArrowLeft className='h-4 w-4' />
        <span className='text-sm font-medium'>{t('register.back_to_home')}</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="relative z-10 bg-surface h-fit border border-hairline rounded-lg shadow-[var(--shadow-level-1)] p-10 md:p-10 w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-ink mb-2">{t('register.create_account')}</h2>
          <p className="text-ink-muted text-sm">{t('register.join_community')}</p>
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
          {loading ? t('register.signing_in') : t('register.continue_with_google')}
        </Button>

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-hairline"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-surface text-ink-muted rounded-full">{t('register.or_signup_with_email')}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-ink-secondary mb-2">
              {t('register.display_name')}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-ink-faint group-focus-within:text-primary transition-colors" />
              </div>
              <Input
                type="text"
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                placeholder={t('register.name_placeholder')}
                required
                disabled={loading}
                className="pl-10! pr-4!"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ink-secondary mb-2">
              {t('register.email_address')}
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
                placeholder={t('register.email_placeholder')}
                required
                disabled={loading}
                className="pl-10! pr-4!"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-ink-secondary mb-2">
              {t('register.password')}
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
                placeholder={t('register.password_placeholder')}
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

          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="w-full mt-2"
          >
            {loading ? (
              t('register.creating_account')
            ) : (
              <>
                <UserPlus className="h-5 w-5" />
                {t('register.sign_up')}
              </>
            )}
          </Button>
        </form>

        <p className="text-center text-ink-muted text-sm mt-8">
          {t('register.already_have_account')}{' '}
          <Link
            to="/login"
            className="text-primary font-semibold hover:text-primary-active transition-colors"
          >
            {t('register.sign_in')}
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
