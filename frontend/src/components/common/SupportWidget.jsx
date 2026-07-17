import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, Mail, MessageSquare, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const SupportWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const supportOptions = [
    {
      icon: Mail,
      title: t('support_widget.email_support'),
      description: t('support_widget.email_address'),
      action: () => {
        window.location.href = `mailto:support@inavora.com?subject=${encodeURIComponent(t('support_widget.support_request'))}`;
        setIsOpen(false);
      }
    },
    {
      icon: MessageSquare,
      title: t('support_widget.contact_form'),
      description: t('support_widget.send_message'),
      action: () => {
        navigate('/contact');
        setIsOpen(false);
      }
    }
  ];

  return (
    <>
      {/* Floating Support Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-50 w-14 h-14 rounded-full bg-primary hover:bg-primary-active text-on-primary shadow-[var(--shadow-level-1)] transition-all flex items-center justify-center group"
        title={t('support_widget.need_help')}
      >
        <HelpCircle className="w-6 h-6" />
      </motion.button>

      {/* Support Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed bottom-24 right-8 z-50 w-80 bg-surface border border-hairline rounded-xl p-6 shadow-[var(--shadow-level-2)]"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-ink">{t('support_widget.need_help')}</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-canvas-soft rounded-md transition-colors"
                >
                  <X className="w-5 h-5 text-ink-muted" />
                </button>
              </div>
              <p className="text-sm text-ink-muted mb-4">
                {t('support_widget.get_in_touch')}
              </p>
              <div className="space-y-2">
                {supportOptions.map((option, index) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={index}
                      onClick={option.action}
                      className="w-full flex items-center gap-3 p-3 bg-canvas-soft hover:bg-hairline/40 rounded-md transition-colors text-left group"
                    >
                      <div className="p-2 bg-primary/10 rounded-md group-hover:bg-primary/20 transition-colors">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-ink text-sm">{option.title}</p>
                        <p className="text-xs text-ink-muted">{option.description}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-ink-faint group-hover:text-ink-muted" />
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default SupportWidget;
