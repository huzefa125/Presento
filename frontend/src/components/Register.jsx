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

  const { register } = useAuth();

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

      let errorMessage = t('register.registration_failed');

      if (error.code === 'EMAIL_ALREADY_EXISTS') {
        errorMessage = t('register.email_already_in_use');
      } else {
        errorMessage = translateError(error, t, 'register.registration_failed');
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
