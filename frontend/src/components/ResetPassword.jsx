import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock, Eye, EyeOff, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { translateError } from '../utils/errorTranslator';
import api from '../config/api';

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
    if (score <= 2) return 'bg-orange-500';
    if (score <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = (score) => {
    if (score <= 1) return t('reset_password.weak');
    if (score <= 2) return t('reset_password.fair');
    if (score <= 3) return t('reset_password.good');
    return t('reset_password.strong');
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-5">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-teal-400 mx-auto mb-4" />
          <p className="text-gray-400">{t('reset_password.verifying_otp')}</p>
        </div>
      </div>
    );
  }

  if (!otpValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-5 relative overflow-hidden font-sans text-white">
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-red-600/20 blur-[120px] animate-pulse" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 bg-[#1e293b]/80 backdrop-blur-xl border border-red-500/20 rounded-2xl shadow-2xl p-8 md:p-10 w-full max-w-lg text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-600/20 mb-4">
            <Lock className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">{t('reset_password.invalid_otp_title')}</h2>
          <p className="text-gray-400 mb-6">{error || t('reset_password.invalid_otp_message')}</p>
          <Link
            to="/forgot-password"
            className="inline-block bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold py-3 px-6 rounded-xl hover:shadow-lg hover:shadow-teal-500/25 transform hover:-translate-y-0.5 transition-all duration-200"
          >
            {t('reset_password.request_new_otp')}
          </Link>
        </motion.div>
      </div>
    );
  }

  if (passwordReset) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-5 relative overflow-hidden font-sans text-white">
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-green-600/20 blur-[120px] animate-pulse" />
        </div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative z-10 bg-[#1e293b]/80 backdrop-blur-xl border border-green-500/20 rounded-2xl shadow-2xl p-8 md:p-10 w-full max-w-lg text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-600/20 mb-6"
          >
            <CheckCircle className="h-10 w-10 text-green-400" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-4">{t('reset_password.success_title')}</h2>
          <p className="text-gray-400 mb-6">{t('reset_password.success_message')}</p>
          <p className="text-gray-500 text-sm mb-8">{t('reset_password.redirecting')}</p>
          <Link
            to="/login"
            className="inline-block bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold py-3 px-6 rounded-xl hover:shadow-lg hover:shadow-teal-500/25 transform hover:-translate-y-0.5 transition-all duration-200"
          >
            {t('reset_password.go_to_login')}
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-5 relative overflow-hidden font-sans text-white">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-600/10 blur-[120px] animate-pulse delay-1000" />
      </div>

      <motion.div
        initial={{ x: -30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className='absolute top-10 left-10 z-20 hover:cursor-pointer text-gray-300 hover:text-white flex gap-2 justify-center items-center bg-white/5 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-sm transition-colors'
        onClick={() => navigate('/login')}
      >
        <ArrowLeft className='h-4 w-4' />
        <span className='text-sm font-medium'>{t('reset_password.back_to_login')}</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="relative z-10 bg-[#1e293b]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 md:p-10 w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600/20 mb-4">
            <Lock className="h-8 w-8 text-blue-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">{t('reset_password.title')}</h2>
          <p className="text-gray-400 text-sm">{t('reset_password.subtitle')}</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              {t('reset_password.new_password')}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-teal-400 transition-colors" />
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
                className="w-full pl-10 pr-12 py-3.5 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 text-white placeholder-gray-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center z-10"
                disabled={loading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer" />
                )}
              </button>
            </div>
            {formData.password && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${getStrengthColor(passwordStrength.score)}`}
                      style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium ${
                    passwordStrength.score <= 1 ? 'text-red-400' :
                    passwordStrength.score <= 2 ? 'text-orange-400' :
                    passwordStrength.score <= 3 ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {getStrengthText(passwordStrength.score)}
                  </span>
                </div>
                {passwordStrength.feedback.length > 0 && (
                  <ul className="text-xs text-gray-500 mt-1 space-y-1">
                    {passwordStrength.feedback.map((msg, idx) => (
                      <li key={idx}>• {msg}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
              {t('reset_password.confirm_password')}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-teal-400 transition-colors" />
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
                className="w-full pl-10 pr-12 py-3.5 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 text-white placeholder-gray-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center z-10"
                disabled={loading}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer" />
                )}
              </button>
            </div>
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="text-red-400 text-xs mt-1">{t('reset_password.passwords_dont_match')}</p>
            )}
            {formData.confirmPassword && formData.password === formData.confirmPassword && formData.password.length >= 6 && (
              <p className="text-green-400 text-xs mt-1">{t('reset_password.passwords_match')}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || formData.password !== formData.confirmPassword || formData.password.length < 6}
            className="w-full bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold py-3.5 rounded-xl hover:shadow-lg hover:shadow-teal-500/25 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {t('reset_password.resetting')}
              </>
            ) : (
              t('reset_password.reset_password')
            )}
          </button>
        </form>

        <p className="text-center text-gray-400 text-sm mt-8">
          {t('reset_password.remember_password')}{' '}
          <Link
            to="/login"
            className="text-teal-400 font-semibold hover:text-teal-300 transition-colors"
          >
            {t('reset_password.back_to_login')}
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default ResetPassword;

