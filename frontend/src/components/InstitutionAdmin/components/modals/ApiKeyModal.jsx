import { motion, AnimatePresence } from 'framer-motion';
import { X, Key } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

const ApiKeyModal = ({ isOpen, onClose, onCreate, loading, newApiKey, setNewApiKey }) => {
    const { t } = useTranslation();
    const [name, setName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) {
            return;
        }
        setNewApiKey({ name: name.trim(), permissions: [] });
        onCreate();
    };

    const handleClose = () => {
        setName('');
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
                        className="bg-surface rounded-xl shadow-[var(--shadow-level-2)] w-full max-w-lg border border-hairline"
                    >
                        <div className="p-6 border-b border-hairline flex items-center justify-between">
                            <h2 className="text-xl sm:text-2xl font-bold text-ink">{t('institution_admin.create_api_key')}</h2>
                            <button
                                onClick={handleClose}
                                className="p-2 hover:bg-canvas-soft rounded-md transition-colors text-ink-muted hover:text-ink"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6">
                            <p className="text-ink-muted mb-4">
                                {t('institution_admin.api_key_modal_description') || 'Create a new API key to authenticate requests to your institution API.'}
                            </p>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-ink-secondary mb-2">
                                    {t('institution_admin.api_key_name')}
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder={t('institution_admin.api_key_name_placeholder')}
                                    className="w-full px-4 py-2 bg-surface border border-[#dddddd] rounded-xs text-ink placeholder:text-ink-faint outline-none transition-shadow duration-150 focus:shadow-[var(--shadow-level-1)] focus:border-primary"
                                    required
                                    autoFocus
                                />
                                <p className="text-xs text-ink-muted mt-1">
                                    {t('institution_admin.api_key_name_desc') || 'Give your API key a descriptive name to identify its purpose.'}
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
                                    disabled={loading || !name.trim()}
                                    className="px-4 py-2 bg-primary text-on-primary font-semibold rounded-full hover:bg-primary-active transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                                            {t('institution_admin.creating')}
                                        </>
                                    ) : (
                                        <>
                                            <Key className="w-4 h-4" />
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

export default ApiKeyModal;
