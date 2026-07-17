import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MailCheck, ArrowLeft, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../config/firebase';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const RESEND_COOLDOWN_SECONDS = 30;

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { resendVerificationEmail } = useAuth();

  const email = location.state?.email || auth.currentUser?.email || '';
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN_SECONDS);
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await resendVerificationEmail();
      toast.success(t('verify_email.resend_success'));
      startCooldown();
    } catch (error) {
      console.error('Resend verification error:', error);
      toast.error(error.message || t('verify_email.resend_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-5 relative overflow-hidden font-sans text-white">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-600/10 blur-[120px] animate-pulse delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="relative z-10 bg-[#1e293b]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-10 w-full max-w-lg text-center"
      >
        <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-teal-500/10 flex items-center justify-center">
          <MailCheck className="h-8 w-8 text-teal-400" />
        </div>

        <h2 className="text-3xl font-bold text-white mb-2">{t('verify_email.title')}</h2>
        <p className="text-gray-400 text-sm mb-1">{t('verify_email.description')}</p>
        {email && <p className="text-teal-400 font-medium mb-6">{email}</p>}

        <button
          onClick={handleResend}
          disabled={loading || cooldown > 0}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold py-3.5 rounded-xl hover:shadow-lg hover:shadow-teal-500/25 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none mb-6"
        >
          <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          {cooldown > 0
            ? t('verify_email.resend_in', { seconds: cooldown })
            : loading
              ? t('verify_email.sending')
              : t('verify_email.resend_button')}
        </button>

        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('verify_email.back_to_login')}
        </Link>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
