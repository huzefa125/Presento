import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Shield, ArrowLeft, Loader2, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { translateError } from '../utils/errorTranslator';
import api from '../config/api';
import Button from './ui/Button';

const VerifyOTP = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpVerified, setOtpVerified] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  useEffect(() => {
    // Countdown timer for resend
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleOtpChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (value && index === 5 && newOtp.every(digit => digit !== '')) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    // Handle paste
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then(text => {
        const digits = text.replace(/\D/g, '').slice(0, 6).split('');
        if (digits.length === 6) {
          const newOtp = [...otp];
          digits.forEach((digit, i) => {
            newOtp[i] = digit;
          });
          setOtp(newOtp);
          inputRefs.current[5]?.focus();
          handleVerifyOTP(digits.join(''));
        }
      });
    }
  };

  const handleVerifyOTP = async (otpValue = null) => {
    const otpString = otpValue || otp.join('');

    if (otpString.length !== 6) {
      setError(t('verify_otp.invalid_otp_length'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/password-reset/verify-otp', {
        email,
        otp: otpString
      });

      if (response.data.success) {
        setOtpVerified(true);
        toast.success(t('verify_otp.otp_verified_success'));
        // Navigate to reset password page with email and OTP
        setTimeout(() => {
          navigate(`/reset-password?email=${encodeURIComponent(email)}&otp=${otpString}`);
        }, 1000);
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      const errorMessage = translateError(error, t, 'verify_otp.verification_failed');
      setError(errorMessage);
      toast.error(errorMessage);
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/password-reset/request', { email });

      if (response.data.success) {
        setResendCooldown(60); // 60 second cooldown
        toast.success(t('verify_otp.otp_resent_success'));
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      const errorMessage = translateError(error, t, 'verify_otp.resend_failed');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (otpVerified) {
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
            <Shield className="h-10 w-10 text-accent-green" />
          </motion.div>
          <h2 className="text-2xl font-bold text-ink mb-4">{t('verify_otp.verified_title')}</h2>
          <p className="text-ink-muted mb-6">{t('verify_otp.redirecting')}</p>
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
        onClick={() => navigate('/forgot-password')}
      >
        <ArrowLeft className='h-4 w-4' />
        <span className='text-sm font-medium'>{t('verify_otp.back')}</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="relative z-10 bg-surface border border-hairline rounded-lg shadow-[var(--shadow-level-1)] p-8 md:p-10 w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-ink tracking-tight mb-2">{t('verify_otp.title')}</h2>
          <p className="text-ink-muted text-sm mb-2">
            {t('verify_otp.subtitle')} <strong className="text-ink">{email}</strong>
          </p>
          <p className="text-ink-faint text-xs">{t('verify_otp.enter_otp_below')}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-md mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={(e) => {
          e.preventDefault();
          handleVerifyOTP();
        }} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-ink-secondary mb-4 text-center">
              {t('verify_otp.otp_code')}
            </label>
            <div className="flex justify-center gap-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={loading}
                  className="w-12 h-12 md:w-14 md:h-14 text-center text-2xl font-bold bg-surface border border-hairline rounded-xs text-ink outline-none transition-all duration-150 focus:border-primary focus:shadow-[var(--shadow-level-1)] disabled:opacity-50 disabled:cursor-not-allowed"
                />
              ))}
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || otp.some(digit => !digit)}
            className="w-full mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {t('verify_otp.verifying')}
              </>
            ) : (
              t('verify_otp.verify_otp')
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-ink-muted text-sm mb-3">
            {t('verify_otp.didnt_receive_otp')}
          </p>
          <button
            onClick={handleResendOTP}
            disabled={loading || resendCooldown > 0}
            className="text-primary font-semibold hover:text-primary-active transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
          >
            {resendCooldown > 0 ? (
              <>
                <RotateCcw className="h-4 w-4 animate-spin" />
                {t('verify_otp.resend_in', { seconds: resendCooldown })}
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4" />
                {t('verify_otp.resend_otp')}
              </>
            )}
          </button>
        </div>

        <p className="text-center text-ink-muted text-sm mt-8">
          {t('verify_otp.remember_password')}{' '}
          <Link
            to="/login"
            className="text-primary font-semibold hover:text-primary-active transition-colors"
          >
            {t('verify_otp.back_to_login')}
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default VerifyOTP;
