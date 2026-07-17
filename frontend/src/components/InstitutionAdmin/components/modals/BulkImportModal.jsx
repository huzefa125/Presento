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
                        className="bg-[#1e293b] rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide border border-white/10"
                    >
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <h2 className="text-xl sm:text-2xl font-bold">{t('institution_admin.bulk_import_title')}</h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">{t('institution_admin.upload_csv_file')}</label>
                                <input
                                    type="file"
                                    accept=".csv"
                                    className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-500 file:text-white hover:file:bg-teal-600 cursor-pointer"
                                />
                                <p className="mt-2 text-xs text-gray-400">{t('institution_admin.csv_format_help')}</p>
                            </div>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-colors"
                                >
                                    {t('institution_admin.cancel')}
                                </button>
                                <button
                                    onClick={onImport}
                                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-teal-500/25 transition-all flex items-center gap-2"
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

