import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Shield, ArrowLeft, Loader2, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { translateError } from '../utils/errorTranslator';
import api from '../config/api';

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
            <Shield className="h-10 w-10 text-green-400" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-4">{t('verify_otp.verified_title')}</h2>
          <p className="text-gray-400 mb-6">{t('verify_otp.redirecting')}</p>
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
        onClick={() => navigate('/forgot-password')}
      >
        <ArrowLeft className='h-4 w-4' />
        <span className='text-sm font-medium'>{t('verify_otp.back')}</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="relative z-10 bg-[#1e293b]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 md:p-10 w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600/20 mb-4">
            <Shield className="h-8 w-8 text-blue-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">{t('verify_otp.title')}</h2>
          <p className="text-gray-400 text-sm mb-2">
            {t('verify_otp.subtitle')} <strong className="text-white">{email}</strong>
          </p>
          <p className="text-gray-500 text-xs">{t('verify_otp.enter_otp_below')}</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={(e) => {
          e.preventDefault();
          handleVerifyOTP();
        }} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-4 text-center">
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
                  className="w-14 h-14 text-center text-2xl font-bold bg-slate-900/50 border-2 border-white/10 rounded-xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 text-white outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || otp.some(digit => !digit)}
            className="w-full bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold py-3.5 rounded-xl hover:shadow-lg hover:shadow-teal-500/25 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {t('verify_otp.verifying')}
              </>
            ) : (
              t('verify_otp.verify_otp')
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm mb-3">
            {t('verify_otp.didnt_receive_otp')}
          </p>
          <button
            onClick={handleResendOTP}
            disabled={loading || resendCooldown > 0}
            className="text-teal-400 font-semibold hover:text-teal-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
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

        <p className="text-center text-gray-400 text-sm mt-8">
          {t('verify_otp.remember_password')}{' '}
          <Link
            to="/login"
            className="text-teal-400 font-semibold hover:text-teal-300 transition-colors"
          >
            {t('verify_otp.back_to_login')}
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default VerifyOTP;

