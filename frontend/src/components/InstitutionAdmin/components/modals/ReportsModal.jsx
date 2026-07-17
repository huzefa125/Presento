import { motion, AnimatePresence } from 'framer-motion';
import { X, FileSpreadsheet } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ReportsModal = ({ isOpen, onClose, onGenerate, loading }) => {
    const { t } = useTranslation();

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-surface rounded-xl shadow-[var(--shadow-level-2)] w-full max-w-lg border border-hairline"
                    >
                        <div className="p-6 border-b border-hairline flex items-center justify-between">
                            <h2 className="text-xl sm:text-2xl font-bold text-ink">{t('institution_admin.generate_report')}</h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-canvas-soft rounded-md transition-colors text-ink-muted hover:text-ink"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-ink-muted mb-4">{t('institution_admin.report_modal_description')}</p>
                            <div className="flex gap-3 justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 border border-hairline rounded-md text-ink hover:bg-canvas-soft transition-colors"
                                >
                                    {t('institution_admin.cancel')}
                                </button>
                                <button
                                    type="button"
                                    onClick={onGenerate}
                                    disabled={loading}
                                    className="px-4 py-2 bg-primary text-on-primary font-semibold rounded-full hover:bg-primary-active transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                                            {t('institution_admin.generating')}
                                        </>
                                    ) : (
                                        <>
                                            <FileSpreadsheet className="w-4 h-4" />
                                            {t('institution_admin.generate')}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ReportsModal;

