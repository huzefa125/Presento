import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, Send, Loader2 } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { translateError } from '../utils/errorTranslator';
import api from '../config/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email) {
      setError(t('forgot_password.email_required'));
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t('forgot_password.invalid_email'));
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/password-reset/request', { email });

      if (response.data.success) {
        setEmailSent(true);
        toast.success(t('forgot_password.otp_sent_success'));
        // Navigate to verify OTP page after 2 seconds
        setTimeout(() => {
          navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
        }, 2000);
      }
    } catch (error) {
      console.error('Password reset request error:', error);
      const errorMessage = translateError(error, t, 'forgot_password.request_failed');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-5 relative overflow-hidden font-sans text-white">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-600/10 blur-[120px] animate-pulse delay-1000" />
        <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] rounded-full bg-orange-500/10 blur-[100px] animate-pulse delay-2000" />
      </div>

      <motion.div
        initial={{ x: -30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        className='absolute top-10 left-10 z-20 hover:cursor-pointer text-gray-300 hover:text-white flex gap-2 justify-center items-center bg-white/5 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-sm transition-colors'
        onClick={() => navigate('/login')}
      >
        <ArrowLeft className='h-4 w-4' />
        <span className='text-sm font-medium'>{t('forgot_password.back_to_login')}</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="relative z-10 bg-[#1e293b]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 md:p-10 w-full max-w-lg"
      >
        {!emailSent ? (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600/20 mb-4">
                <Mail className="h-8 w-8 text-blue-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">{t('forgot_password.title')}</h2>
              <p className="text-gray-400 text-sm">{t('forgot_password.subtitle')}</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  {t('forgot_password.email_address')}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-teal-400 transition-colors" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    placeholder={t('forgot_password.email_placeholder')}
                    required
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-3.5 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 text-white placeholder-gray-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold py-3.5 rounded-xl hover:shadow-lg hover:shadow-teal-500/25 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none mt-2 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {t('forgot_password.sending')}
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    {t('forgot_password.send_otp')}
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-gray-400 text-sm mt-8">
              {t('forgot_password.remember_password')}{' '}
              <Link
                to="/login"
                className="text-teal-400 font-semibold hover:text-teal-300 transition-colors"
              >
                {t('forgot_password.back_to_login')}
              </Link>
            </p>
          </>
        ) : (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-600/20 mb-6"
            >
              <Mail className="h-10 w-10 text-green-400" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-4">{t('forgot_password.email_sent')}</h2>
            <p className="text-gray-400 mb-6">
              {t('forgot_password.check_email')} <strong className="text-white">{email}</strong>
            </p>
            <p className="text-gray-500 text-sm mb-8">
              {t('forgot_password.otp_instructions')}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-teal-500/25 transform hover:-translate-y-0.5 transition-all duration-200"
              >
                {t('forgot_password.enter_otp')}
              </button>
              <button
                onClick={() => {
                  setEmailSent(false);
                  setEmail('');
                }}
                className="w-full bg-slate-800/50 text-white font-semibold py-3 rounded-xl hover:bg-slate-700/50 transition-all duration-200 border border-white/10"
              >
                {t('forgot_password.send_another_otp')}
              </button>
              <Link
                to="/login"
                className="block w-full text-center text-teal-400 font-semibold hover:text-teal-300 transition-colors py-2"
              >
                {t('forgot_password.back_to_login')}
              </Link>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPassword;

