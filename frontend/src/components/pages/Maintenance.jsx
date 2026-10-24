import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Mail, Phone, Wrench } from 'lucide-react';
import api from '../../config/api';

const Maintenance = () => {
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    'The system is currently undergoing scheduled maintenance. Please check back later.'
  );
  const [checking, setChecking] = useState(false);
  const [statusNote, setStatusNote] = useState('');

  useEffect(() => {
    checkMaintenanceStatus();
    const interval = setInterval(() => checkMaintenanceStatus(false), 20000);
    return () => clearInterval(interval);
  }, []);

  const checkMaintenanceStatus = async (showFeedback = false) => {
    setChecking(true);
    setStatusNote('');
    try {
      const response = await api.get('/maintenance/status');
      if (response.data && response.data.success) {
        if (!response.data.maintenance) {
          window.location.href = '/';
          return;
        }
        if (response.data.message) {
          setMaintenanceMessage(response.data.message);
        }
        if (showFeedback) {
          setStatusNote('Still under maintenance. We will be back online shortly!');
        }
      } else if (showFeedback) {
        setStatusNote('Still under maintenance. Please check again in a moment.');
      }
    } catch (error) {
      console.error('Error checking maintenance status:', error);
      if (showFeedback) {
        setStatusNote('Unable to reach server. We are working to restore service.');
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas-soft text-ink flex flex-col justify-between font-sans selection:bg-primary/10">
      {/* Top Header */}
      <header className="px-6 py-6 max-w-5xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-base shadow-sm">
            P
          </div>
          <span className="font-semibold text-lg tracking-tight text-ink">Presento</span>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-hairline text-xs font-medium text-ink-secondary shadow-sm">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          <span>Scheduled Maintenance</span>
        </div>
      </header>

      {/* Hero / Center Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="max-w-md w-full text-center"
        >
          {/* Stylish minimal icon badge */}
          <div className="mx-auto mb-6 w-14 h-14 rounded-2xl bg-surface border border-hairline shadow-sm flex items-center justify-center text-primary">
            <Wrench className="w-6 h-6 text-primary" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink mb-3">
            Under Maintenance
          </h1>

          <p className="text-sm sm:text-base text-ink-muted leading-relaxed mb-8">
            {maintenanceMessage}
          </p>

          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => checkMaintenanceStatus(true)}
              disabled={checking}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-ink text-canvas hover:opacity-90 active:scale-95 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
              <span>{checking ? 'Checking...' : 'Check Again'}</span>
            </button>

            {statusNote && (
              <p className="text-xs text-ink-muted transition-opacity duration-200">
                {statusNote}
              </p>
            )}
          </div>
        </motion.div>
      </main>

      {/* Minimal Footer */}
      <footer className="px-6 py-6 border-t border-hairline/60 text-center">
        <div className="text-xs text-ink-muted flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <span>Need immediate assistance?</span>
          <a
            href="mailto:support@inavora.com"
            className="inline-flex items-center gap-1.5 text-ink hover:text-primary transition-colors font-medium"
          >
            <Mail className="w-3.5 h-3.5" />
            support@inavora.com
          </a>
          <span className="hidden sm:inline text-hairline">•</span>
          <a
            href="tel:+919043411110"
            className="inline-flex items-center gap-1.5 text-ink hover:text-primary transition-colors font-medium"
          >
            <Phone className="w-3.5 h-3.5" />
            +91 9043411110
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Maintenance;
