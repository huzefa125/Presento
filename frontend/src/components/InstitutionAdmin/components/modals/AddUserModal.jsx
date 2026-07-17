import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const AddUserModal = ({ isOpen, onClose, onAddUser, loading, newUser, setNewUser }) => {
    const { t } = useTranslation();

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-surface border border-hairline rounded-xl p-6 max-w-md w-full pointer-events-auto shadow-[var(--shadow-level-2)]"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-ink">{t('institution_admin.add_user_modal_title')}</h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-canvas-soft rounded-md transition-colors text-ink-muted hover:text-ink"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={onAddUser} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-ink-secondary mb-2">
                                        {t('institution_admin.email_label')} *
                                        <span className="text-xs text-ink-muted ml-2 font-normal">{t('institution_admin.email_input_hint')}</span>
                                    </label>
                                    <textarea
                                        required
                                        value={newUser?.email || ''}
                                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                        className="w-full px-4 py-3 bg-surface border border-[#dddddd] rounded-xs text-ink outline-none transition-shadow duration-150 focus:shadow-[var(--shadow-level-1)] focus:border-primary text-sm resize-y min-h-[100px] font-mono"
                                        placeholder={t('institution_admin.email_placeholder') || 'user@example.com\nuser2@example.com\nuser3@example.com'}
                                        rows={6}
                                    />
                                    <p className="text-xs text-ink-muted mt-1">
                                        {t('institution_admin.email_input_description')}
                                    </p>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 py-2.5 bg-surface border border-hairline text-ink font-medium rounded-md hover:bg-canvas-soft transition-all text-sm"
                                    >
                                        {t('institution_admin.cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 py-2.5 bg-primary text-on-primary font-medium rounded-full hover:bg-primary-active transition-all disabled:opacity-50 text-sm"
                                    >
                                        {loading ? t('institution_admin.adding') : t('institution_admin.add_user')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default AddUserModal;

