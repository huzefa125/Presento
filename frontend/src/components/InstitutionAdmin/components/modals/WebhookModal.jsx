import { motion, AnimatePresence } from 'framer-motion';
import { X, Webhook } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

const WebhookModal = ({ isOpen, onClose, onCreate, loading, newWebhook, setNewWebhook }) => {
    const { t } = useTranslation();
    const [url, setUrl] = useState('');
    const [secret, setSecret] = useState('');
    const [selectedEvents, setSelectedEvents] = useState([]);

    const availableEvents = [
        { value: 'user.added', label: t('institution_admin.event_user_added') || 'User Added' },
        { value: 'user.removed', label: t('institution_admin.event_user_removed') || 'User Removed' },
        { value: 'presentation.created', label: t('institution_admin.event_presentation_created') || 'Presentation Created' },
        { value: 'presentation.ended', label: t('institution_admin.event_presentation_ended') || 'Presentation Ended' },
        { value: 'subscription.renewed', label: t('institution_admin.event_subscription_renewed') || 'Subscription Renewed' }
    ];

    const toggleEvent = (eventValue) => {
        setSelectedEvents(prev =>
            prev.includes(eventValue)
                ? prev.filter(e => e !== eventValue)
                : [...prev, eventValue]
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!url.trim()) {
            return;
        }
        setNewWebhook({
            url: url.trim(),
            events: selectedEvents,
            secret: secret.trim()
        });
        onCreate();
    };

    const handleClose = () => {
        setUrl('');
        setSecret('');
        setSelectedEvents([]);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-surface rounded-xl shadow-[var(--shadow-level-2)] w-full max-w-lg border border-hairline max-h-[90vh] overflow-y-auto"
                    >
                        <div className="p-6 border-b border-hairline flex items-center justify-between sticky top-0 bg-surface z-10">
                            <h2 className="text-xl sm:text-2xl font-bold text-ink">{t('institution_admin.create_webhook')}</h2>
                            <button
                                onClick={handleClose}
                                className="p-2 hover:bg-canvas-soft rounded-md transition-colors text-ink-muted hover:text-ink"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6">
                            <p className="text-ink-muted mb-4">
                                {t('institution_admin.webhook_modal_description') || 'Create a webhook to receive notifications when events occur in your institution.'}
                            </p>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-ink-secondary mb-2">
                                    {t('institution_admin.webhook_url')} <span className="text-red-600">*</span>
                                </label>
                                <input
                                    type="url"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://example.com/webhook"
                                    className="w-full px-4 py-2 bg-surface border border-[#dddddd] rounded-xs text-ink placeholder:text-ink-faint outline-none transition-shadow duration-150 focus:shadow-[var(--shadow-level-1)] focus:border-primary"
                                    required
                                    autoFocus
                                />
                                <p className="text-xs text-ink-muted mt-1">
                                    {t('institution_admin.webhook_url_desc') || 'The URL where webhook events will be sent.'}
                                </p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-ink-secondary mb-2">
                                    {t('institution_admin.events')}
                                </label>
                                <div className="space-y-2">
                                    {availableEvents.map((event) => (
                                        <label
                                            key={event.value}
                                            className="flex items-center gap-2 p-2 bg-canvas-soft border border-hairline rounded-md cursor-pointer hover:bg-canvas-soft/70 transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedEvents.includes(event.value)}
                                                onChange={() => toggleEvent(event.value)}
                                                className="w-4 h-4 text-primary bg-surface border-[#dddddd] rounded focus:ring-primary"
                                            />
                                            <span className="text-sm text-ink">{event.label}</span>
                                        </label>
                                    ))}
                                </div>
                                <p className="text-xs text-ink-muted mt-1">
                                    {t('institution_admin.events_desc') || 'Select which events should trigger this webhook.'}
                                </p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-ink-secondary mb-2">
                                    {t('institution_admin.webhook_secret')} ({t('institution_admin.optional') || 'Optional'})
                                </label>
                                <input
                                    type="text"
                                    value={secret}
                                    onChange={(e) => setSecret(e.target.value)}
                                    placeholder={t('institution_admin.webhook_secret_placeholder')}
                                    className="w-full px-4 py-2 bg-surface border border-[#dddddd] rounded-xs text-ink placeholder:text-ink-faint outline-none transition-shadow duration-150 focus:shadow-[var(--shadow-level-1)] focus:border-primary"
                                />
                                <p className="text-xs text-ink-muted mt-1">
                                    {t('institution_admin.webhook_secret_desc') || 'Optional secret for webhook verification. This will be included in the webhook payload.'}
                                </p>
                            </div>

                            <div className="flex gap-3 justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="px-4 py-2 border border-hairline rounded-md text-ink hover:bg-canvas-soft transition-colors"
                                >
                                    {t('institution_admin.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !url.trim()}
                                    className="px-4 py-2 bg-primary text-on-primary font-semibold rounded-full hover:bg-primary-active transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                                            {t('institution_admin.creating')}
                                        </>
                                    ) : (
                                        <>
                                            <Webhook className="w-4 h-4" />
                                            {t('institution_admin.create')}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default WebhookModal;
