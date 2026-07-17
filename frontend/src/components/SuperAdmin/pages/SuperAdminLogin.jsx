import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../../config/api';
import { useTranslation } from 'react-i18next';
import { translateError } from '../../../utils/errorTranslator';
import { Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react';

const SuperAdminLogin = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!password) {
      setPasswordError('Please enter a password');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/super-admin/login', { password });
      
      if (response.data.success && response.data.token) {
        sessionStorage.setItem('superAdminToken', response.data.token);
        setPassword('');
        setPasswordError('');
        toast.success(t('super_admin.access_granted'));
        navigate('/super-admin');
      } else {
        setPasswordError('Invalid password. Please try again.');
        setPassword('');
        toast.error(t('super_admin.invalid_password'));
      }
    } catch (error) {
      const errorMessage = translateError(error, t, 'common.something_went_wrong');
      setPasswordError(errorMessage);
      setPassword('');
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas-soft text-ink flex items-center justify-center p-4 font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 bg-surface border border-hairline rounded-lg p-8 max-w-md w-full shadow-[var(--shadow-level-2)]"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-lg bg-primary flex items-center justify-center shadow-[var(--shadow-level-1)]">
            <Lock className="w-10 h-10 text-on-primary" />
          </div>
          <h2 className="text-3xl font-bold mb-2 text-ink">
            Super Admin Access
          </h2>
          <p className="text-ink-muted">Enter your credentials to continue</p>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-ink-secondary mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError('');
                }}
                className="w-full px-4 py-2.5 pr-12 bg-surface border border-[#dddddd] rounded-xs text-ink placeholder-ink-faint outline-none transition-shadow duration-150 focus:shadow-[var(--shadow-level-1)] focus:border-primary"
                placeholder="Enter admin password"
                autoFocus
                disabled={loading}
                autoComplete="new-password"
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
            {passwordError && (
              <p className="text-red-600 text-sm mt-2">{passwordError}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-on-primary font-semibold rounded-full hover:bg-primary-active active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Authenticating...' : 'Access Dashboard'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-ink-muted hover:text-ink text-sm transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default SuperAdminLogin;

