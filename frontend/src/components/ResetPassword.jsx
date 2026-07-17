import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock, Eye, EyeOff, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { translateError } from '../utils/errorTranslator';
import api from '../config/api';
import Button from './ui/Button';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const email = searchParams.get('email') || '';
  const otp = searchParams.get('otp') || '';

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [otpValid, setOtpValid] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: []
  });

  useEffect(() => {
    const verifyOTP = async () => {
      if (!email || !otp) {
        setOtpValid(false);
        setVerifying(false);
        setError(t('reset_password.invalid_otp'));
        return;
      }

      try {
        const response = await api.post('/password-reset/verify-otp', { email, otp });
        if (response.data.success) {
          setOtpValid(true);
        }
      } catch (error) {
        console.error('OTP verification error:', error);
        setOtpValid(false);
        const errorMessage = translateError(error, t, 'reset_password.invalid_or_expired_otp');
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setVerifying(false);
      }
    };

    verifyOTP();
  }, [email, otp, t]);

  const checkPasswordStrength = (password) => {
    const feedback = [];
    let score = 0;

    if (password.length >= 6) score += 1;
    else feedback.push(t('reset_password.min_length'));

    if (password.length >= 8) score += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
      score += 1;
    } else if (password.length > 0) {
      feedback.push(t('reset_password.mixed_case'));
    }
    if (/\d/.test(password)) {
      score += 1;
    } else if (password.length > 0) {
      feedback.push(t('reset_password.include_number'));
    }
    if (/[^a-zA-Z0-9]/.test(password)) {
      score += 1;
    } else if (password.length > 0) {
      feedback.push(t('reset_password.include_special'));
    }

    return { score, feedback };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setError('');

    if (name === 'password') {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.password || !formData.confirmPassword) {
      setError(t('reset_password.all_fields_required'));
      return;
    }

    if (formData.password.length < 6) {
      setError(t('reset_password.password_too_short'));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t('reset_password.passwords_dont_match'));
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/password-reset/reset', {
        email,
        otp,
        newPassword: formData.password
      });

      if (response.data.success) {
        setPasswordReset(true);
        toast.success(t('reset_password.reset_success'));

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (error) {
      console.error('Password reset error:', error);
      const errorMessage = translateError(error, t, 'reset_password.reset_failed');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = (score) => {
    if (score <= 1) return 'bg-red-500';
    if (score <= 2) return 'bg-accent-orange';
    if (score <= 3) return 'bg-yellow-500';
    return 'bg-accent-green';
  };

  const getStrengthText = (score) => {
    if (score <= 1) return t('reset_password.weak');
    if (score <= 2) return t('reset_password.fair');
    if (score <= 3) return t('reset_password.good');
    return t('reset_password.strong');
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas-soft p-5">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-ink-muted">{t('reset_password.verifying_otp')}</p>
        </div>
      </div>
    );
  }

  if (!otpValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas-soft p-5 font-sans text-ink">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 bg-surface border border-hairline rounded-lg shadow-[var(--shadow-level-1)] p-8 md:p-10 w-full max-w-lg text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-4">
            <Lock className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-ink mb-4">{t('reset_password.invalid_otp_title')}</h2>
          <p className="text-ink-muted mb-6">{error || t('reset_password.invalid_otp_message')}</p>
          <Link
            to="/forgot-password"
            className="inline-block bg-primary text-on-primary font-medium py-3 px-6 rounded-full hover:bg-primary-active transition-colors duration-150"
          >
            {t('reset_password.request_new_otp')}
          </Link>
        </motion.div>
      </div>
    );
  }

  if (passwordReset) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas-soft p-5 font-sans text-ink">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative z-10 bg-surface border border-hairline rounded-lg shadow-[var(--shadow-level-1)] p-8 md:p-10 w-full max-w-lg text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent-green/10 mb-6"
          >
            <CheckCircle className="h-10 w-10 text-accent-green" />
          </motion.div>
          <h2 className="text-2xl font-bold text-ink mb-4">{t('reset_password.success_title')}</h2>
          <p className="text-ink-muted mb-6">{t('reset_password.success_message')}</p>
          <p className="text-ink-faint text-sm mb-8">{t('reset_password.redirecting')}</p>
          <Link
            to="/login"
            className="inline-block bg-primary text-on-primary font-medium py-3 px-6 rounded-full hover:bg-primary-active transition-colors duration-150"
          >
            {t('reset_password.go_to_login')}
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas-soft p-5 font-sans text-ink">
      <motion.div
        initial={{ x: -30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className='absolute top-10 left-10 z-20 hover:cursor-pointer text-ink-muted hover:text-ink flex gap-2 justify-center items-center bg-surface border border-hairline px-4 py-2 rounded-full transition-colors'
        onClick={() => navigate('/login')}
      >
        <ArrowLeft className='h-4 w-4' />
        <span className='text-sm font-medium'>{t('reset_password.back_to_login')}</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="relative z-10 bg-surface border border-hairline rounded-lg shadow-[var(--shadow-level-1)] p-8 md:p-10 w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-ink tracking-tight mb-2">{t('reset_password.title')}</h2>
          <p className="text-ink-muted text-sm">{t('reset_password.subtitle')}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-md mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-ink-secondary mb-2">
              {t('reset_password.new_password')}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-ink-faint group-focus-within:text-primary transition-colors" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={t('reset_password.password_placeholder')}
                required
                disabled={loading}
                autoComplete="new-password"
                className="w-full pl-10 pr-12 py-2.5 bg-surface border border-[#dddddd] rounded-xs text-ink text-[15px] placeholder-ink-faint outline-none transition-shadow duration-150 focus:shadow-[var(--shadow-level-1)] focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center z-10"
                disabled={loading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-ink-faint hover:text-ink-muted transition-colors cursor-pointer" />
                ) : (
                  <Eye className="h-5 w-5 text-ink-faint hover:text-ink-muted transition-colors cursor-pointer" />
                )}
              </button>
            </div>
            {formData.password && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-2 bg-canvas-soft rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${getStrengthColor(passwordStrength.score)}`}
                      style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium ${
                    passwordStrength.score <= 1 ? 'text-red-500' :
                    passwordStrength.score <= 2 ? 'text-accent-orange' :
                    passwordStrength.score <= 3 ? 'text-yellow-600' : 'text-accent-green'
                  }`}>
                    {getStrengthText(passwordStrength.score)}
                  </span>
                </div>
                {passwordStrength.feedback.length > 0 && (
                  <ul className="text-xs text-ink-faint mt-1 space-y-1">
                    {passwordStrength.feedback.map((msg, idx) => (
                      <li key={idx}>• {msg}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-ink-secondary mb-2">
              {t('reset_password.confirm_password')}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-ink-faint group-focus-within:text-primary transition-colors" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder={t('reset_password.confirm_password_placeholder')}
                required
                disabled={loading}
                autoComplete="new-password"
                className="w-full pl-10 pr-12 py-2.5 bg-surface border border-[#dddddd] rounded-xs text-ink text-[15px] placeholder-ink-faint outline-none transition-shadow duration-150 focus:shadow-[var(--shadow-level-1)] focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center z-10"
                disabled={loading}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-ink-faint hover:text-ink-muted transition-colors cursor-pointer" />
                ) : (
                  <Eye className="h-5 w-5 text-ink-faint hover:text-ink-muted transition-colors cursor-pointer" />
                )}
              </button>
            </div>
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{t('reset_password.passwords_dont_match')}</p>
            )}
            {formData.confirmPassword && formData.password === formData.confirmPassword && formData.password.length >= 6 && (
              <p className="text-accent-green text-xs mt-1">{t('reset_password.passwords_match')}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading || formData.password !== formData.confirmPassword || formData.password.length < 6}
            className="w-full mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {t('reset_password.resetting')}
              </>
            ) : (
              t('reset_password.reset_password')
            )}
          </Button>
        </form>

        <p className="text-center text-ink-muted text-sm mt-8">
          {t('reset_password.remember_password')}{' '}
          <Link
            to="/login"
            className="text-primary font-semibold hover:text-primary-active transition-colors"
          >
            {t('reset_password.back_to_login')}
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
