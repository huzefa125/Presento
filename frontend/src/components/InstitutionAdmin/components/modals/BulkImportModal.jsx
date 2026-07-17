import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const BulkImportModal = ({ isOpen, onClose, onImport }) => {
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
                        className="bg-surface rounded-xl shadow-[var(--shadow-level-2)] w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide border border-hairline"
                    >
                        <div className="p-6 border-b border-hairline flex items-center justify-between">
                            <h2 className="text-xl sm:text-2xl font-bold text-ink">{t('institution_admin.bulk_import_title')}</h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-canvas-soft rounded-md transition-colors text-ink-muted hover:text-ink"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-ink-secondary mb-2">{t('institution_admin.upload_csv_file')}</label>
                                <input
                                    type="file"
                                    accept=".csv"
                                    className="w-full px-4 py-2 bg-surface border border-[#dddddd] rounded-xs text-ink text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-on-primary hover:file:bg-primary-active cursor-pointer"
                                />
                                <p className="mt-2 text-xs text-ink-muted">{t('institution_admin.csv_format_help')}</p>
                            </div>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 border border-hairline rounded-md text-ink hover:bg-canvas-soft transition-colors"
                                >
                                    {t('institution_admin.cancel')}
                                </button>
                                <button
                                    onClick={onImport}
                                    className="px-4 py-2 bg-primary text-on-primary font-semibold rounded-full hover:bg-primary-active transition-all flex items-center gap-2"
                                >
                                    <Upload className="w-4 h-4" />
                                    {t('institution_admin.import_users')}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default BulkImportModal;

