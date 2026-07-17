import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MailCheck, ArrowLeft, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../config/firebase';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Button from './ui/Button';

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
    <div className="min-h-screen flex items-center justify-center bg-canvas-soft p-5 font-sans text-ink">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="relative z-10 bg-surface border border-hairline rounded-lg shadow-[var(--shadow-level-1)] p-10 w-full max-w-lg text-center"
      >
        <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <MailCheck className="h-8 w-8 text-primary" />
        </div>

        <h2 className="text-3xl font-bold text-ink tracking-tight mb-2">{t('verify_email.title')}</h2>
        <p className="text-ink-muted text-sm mb-1">{t('verify_email.description')}</p>
        {email && <p className="text-primary font-medium mb-6">{email}</p>}

        <Button
          onClick={handleResend}
          disabled={loading || cooldown > 0}
          className="w-full mb-6"
        >
          <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          {cooldown > 0
            ? t('verify_email.resend_in', { seconds: cooldown })
            : loading
              ? t('verify_email.sending')
              : t('verify_email.resend_button')}
        </Button>

        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('verify_email.back_to_login')}
        </Link>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
