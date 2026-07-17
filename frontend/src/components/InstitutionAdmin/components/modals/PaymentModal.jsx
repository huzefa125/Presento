import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PaymentModal = ({ isOpen, onClose, pendingEmails, paymentLoading, userValidation, institution, onPayment }) => {
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
                            className="bg-surface border border-hairline rounded-xl p-6 max-w-lg w-full pointer-events-auto shadow-[var(--shadow-level-2)]"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-ink">{t('institution_admin.user_limit_reached_title')}</h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-canvas-soft rounded-md transition-colors text-ink-muted hover:text-ink"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-accent-orange/10 border border-accent-orange/20 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-accent-orange mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm text-accent-orange-deep font-medium mb-1">{t('institution_admin.user_limit_reached_title')}</p>
                                            <p className="text-xs text-accent-orange-deep/80">
                                                {t('institution_admin.user_limit_reached_message', { price: t('institution_admin.additional_user_price') })}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-canvas-soft rounded-lg p-4 border border-hairline">
                                    <p className="text-sm text-ink-secondary mb-3 font-medium">{t('institution_admin.users_to_be_added')}</p>
                                    <div className="max-h-32 overflow-y-auto space-y-1">
                                        {pendingEmails?.map((email, index) => (
                                            <div key={index} className="text-xs text-ink-muted font-mono bg-surface px-2 py-1 rounded border border-hairline">
                                                {email}
                                            </div>
                                        ))}
                                    </div>

                                    {userValidation && (
                                        <div className="mt-3 pt-3 border-t border-hairline space-y-2">
                                            {userValidation.existingUsers?.length > 0 && (
                                                <div className="text-xs text-accent-orange-deep">
                                                    <CheckCircle className="w-3 h-3 inline mr-1" />
                                                    {t('institution_admin.users_exist_skipped', { count: userValidation.existingUsers.length })}
                                                </div>
                                            )}
                                            {userValidation.notFoundUsers?.length > 0 && (
                                                <div className="text-xs text-red-600">
                                                    <AlertCircle className="w-3 h-3 inline mr-1" />
                                                    {t('institution_admin.users_not_found_skipped', { count: userValidation.notFoundUsers.length })}
                                                </div>
                                            )}
                                            {userValidation.otherInstitutionUsers?.length > 0 && (
                                                <div className="text-xs text-accent-orange">
                                                    <AlertCircle className="w-3 h-3 inline mr-1" />
                                                    {t('institution_admin.users_other_institution_skipped', { count: userValidation.otherInstitutionUsers.length })}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="mt-4 pt-4 border-t border-hairline">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-ink-secondary">{t('institution_admin.number_of_users')}</span>
                                            <span className="text-lg font-bold text-ink">{pendingEmails?.length || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-sm text-ink-secondary">{t('institution_admin.price_per_user')}</span>
                                            <span className="text-lg font-bold text-ink">{t('institution_admin.price_per_user_value')}</span>
                                        </div>
                                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-hairline">
                                            <span className="text-base font-semibold text-ink">{t('institution_admin.total_amount')}</span>
                                            <span className="text-2xl font-bold text-ink">{t('institution_admin.total_amount_value', { amount: (pendingEmails?.length || 0) * 499 })}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        disabled={paymentLoading}
                                        className="flex-1 py-2.5 bg-surface border border-hairline text-ink font-medium rounded-md hover:bg-canvas-soft transition-all text-sm disabled:opacity-50"
                                    >
                                        {t('institution_admin.cancel')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onPayment}
                                        disabled={paymentLoading}
                                        className="flex-1 py-2.5 bg-primary text-on-primary font-medium rounded-full hover:bg-primary-active transition-all disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                                    >
                                        {paymentLoading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin"></div>
                                                {t('institution_admin.processing_payment')}
                                            </>
                                        ) : (
                                            <>
                                                <CreditCard className="w-4 h-4" />
                                                {t('institution_admin.pay_button', { amount: (pendingEmails?.length || 0) * 499 })}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default PaymentModal;

