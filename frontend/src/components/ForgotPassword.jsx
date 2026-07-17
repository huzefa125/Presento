import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, Send, Loader2 } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { translateError } from '../utils/errorTranslator';
import api from '../config/api';
import Button from './ui/Button';

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
    <div className="min-h-screen flex items-center justify-center bg-canvas-soft p-5 font-sans text-ink">
      <motion.div
        initial={{ x: -30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className='absolute top-10 left-10 z-20 hover:cursor-pointer text-ink-muted hover:text-ink flex gap-2 justify-center items-center bg-surface border border-hairline px-4 py-2 rounded-full transition-colors'
        onClick={() => navigate('/login')}
      >
        <ArrowLeft className='h-4 w-4' />
        <span className='text-sm font-medium'>{t('forgot_password.back_to_login')}</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="relative z-10 bg-surface border border-hairline rounded-lg shadow-[var(--shadow-level-1)] p-8 md:p-10 w-full max-w-lg"
      >
        {!emailSent ? (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-3xl font-bold text-ink tracking-tight mb-2">{t('forgot_password.title')}</h2>
              <p className="text-ink-muted text-sm">{t('forgot_password.subtitle')}</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-md mb-6 text-sm text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-ink-secondary mb-2">
                  {t('forgot_password.email_address')}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-ink-faint group-focus-within:text-primary transition-colors" />
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
                    className="w-full pl-10 pr-4 py-2.5 bg-surface border border-[#dddddd] rounded-xs text-ink text-[15px] placeholder-ink-faint outline-none transition-shadow duration-150 focus:shadow-[var(--shadow-level-1)] focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full mt-2">
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
              </Button>
            </form>

            <p className="text-center text-ink-muted text-sm mt-8">
              {t('forgot_password.remember_password')}{' '}
              <Link
                to="/login"
                className="text-primary font-semibold hover:text-primary-active transition-colors"
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
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent-green/10 mb-6"
            >
              <Mail className="h-10 w-10 text-accent-green" />
            </motion.div>
            <h2 className="text-2xl font-bold text-ink mb-4">{t('forgot_password.email_sent')}</h2>
            <p className="text-ink-muted mb-6">
              {t('forgot_password.check_email')} <strong className="text-ink">{email}</strong>
            </p>
            <p className="text-ink-faint text-sm mb-8">
              {t('forgot_password.otp_instructions')}
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => {
                  navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
                }}
                className="w-full"
              >
                {t('forgot_password.enter_otp')}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setEmailSent(false);
                  setEmail('');
                }}
                className="w-full"
              >
                {t('forgot_password.send_another_otp')}
              </Button>
              <Link
                to="/login"
                className="block w-full text-center text-primary font-semibold hover:text-primary-active transition-colors py-2"
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
