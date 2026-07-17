import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { translateError } from '../../utils/errorTranslator';

const ChangePasswordModal = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const { reauthenticate, currentUser } = useAuth();
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // Disable body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            // Save current overflow style
            const originalOverflow = document.body.style.overflow;
            // Disable scrolling
            document.body.style.overflow = 'hidden';
            
            // Cleanup: restore original overflow when modal closes
            return () => {
                document.body.style.overflow = originalOverflow;
            };
        }
    }, [isOpen]);

    const handlePasswordChange = (field, value) => {
        setPasswordData(prev => ({
            ...prev,
            [field]: value
        }));
        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const validatePassword = () => {
        const newErrors = {};
        
        if (!passwordData.currentPassword) {
            newErrors.currentPassword = t('auth.current_password_required') || 'Current password is required';
        }
        
        if (!passwordData.newPassword) {
            newErrors.newPassword = t('auth.new_password_required') || 'New password is required';
        } else if (passwordData.newPassword.length < 6) {
            newErrors.newPassword = t('auth.password_min_length') || 'Password must be at least 6 characters';
        }
        
        if (!passwordData.confirmPassword) {
            newErrors.confirmPassword = t('auth.confirm_password_required') || 'Please confirm your new password';
        } else if (passwordData.newPassword !== passwordData.confirmPassword) {
            newErrors.confirmPassword = t('auth.passwords_not_match') || 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (!validatePassword()) return;

        // Check if user has password provider
        if (!currentUser?.hasPasswordProvider) {
            toast.error(t('auth.password_change_not_available') || 'Password change is not available for Google sign-in accounts');
            return;
        }

        setLoading(true);
        try {
            // Re-authenticate user with current password to get fresh Firebase token
            const firebaseToken = await reauthenticate(passwordData.currentPassword);

            // Call API to change password
            await api.put('/auth/change-password', {
                firebaseToken,
                newPassword: passwordData.newPassword
            });

            // Reset form on success
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            setErrors({});
            
            toast.success(t('auth.password_changed_success') || 'Password changed successfully');
            onClose();
        } catch (error) {
            console.error('Password change error:', error);
            const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'An error occurred';
            
            // Set specific field errors for better UX
            if (errorMessage.toLowerCase().includes('current password') || 
                errorMessage.toLowerCase().includes('incorrect') ||
                errorMessage.toLowerCase().includes('invalid') ||
                error.code === 'auth/wrong-password' ||
                error.code === 'auth/invalid-credential') {
                setErrors({ currentPassword: t('auth.incorrect_current_password') || 'Current password is incorrect' });
            } else if (errorMessage.toLowerCase().includes('new password') || errorMessage.toLowerCase().includes('at least')) {
                setErrors({ newPassword: errorMessage });
            } else {
                // Generic error
                setErrors({ newPassword: errorMessage });
                toast.error(translateError(error, t, 'auth.password_change_error') || 'Failed to change password');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setErrors({});
        setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
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
                        className="bg-[#1e293b] rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md border border-white/10"
                    >
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                                <Lock className="w-5 h-5 text-teal-400" />
                                {t('auth.change_password') || 'Change Password'}
                            </h2>
                            <button
                                onClick={handleClose}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                disabled={loading}
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <form onSubmit={handlePasswordSubmit} className="p-6 space-y-5">
                            {/* Current Password */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-teal-400" />
                                    {t('auth.current_password') || 'Current Password'}
                                </label>
                                <div className="relative">
                                    <input
                                        type={showCurrentPassword ? 'text' : 'password'}
                                        value={passwordData.currentPassword}
                                        onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                                        className={`w-full px-4 py-2 pr-10 bg-white/5 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                                            errors.currentPassword ? 'border-red-500' : 'border-white/10'
                                        }`}
                                        placeholder={t('auth.current_password_placeholder') || 'Enter current password'}
                                        disabled={loading}
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                        disabled={loading}
                                    >
                                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.currentPassword && (
                                    <p className="text-xs text-red-400 mt-1">{errors.currentPassword}</p>
                                )}
                            </div>

                            {/* New Password */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-teal-400" />
                                    {t('auth.new_password') || 'New Password'}
                                </label>
                                <div className="relative">
                                    <input
                                        type={showNewPassword ? 'text' : 'password'}
                                        value={passwordData.newPassword}
                                        onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                                        className={`w-full px-4 py-2 pr-10 bg-white/5 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                                            errors.newPassword ? 'border-red-500' : 'border-white/10'
                                        }`}
                                        placeholder={t('auth.new_password_placeholder') || 'Enter new password'}
                                        disabled={loading}
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                        disabled={loading}
                                    >
                                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.newPassword && (
                                    <p className="text-xs text-red-400 mt-1">{errors.newPassword}</p>
                                )}
                                <p className="text-xs text-gray-400 mt-1">
                                    {t('auth.password_min_length_hint') || 'Password must be at least 6 characters long'}
                                </p>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-teal-400" />
                                    {t('auth.confirm_password') || 'Confirm New Password'}
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                                        className={`w-full px-4 py-2 pr-10 bg-white/5 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                                            errors.confirmPassword ? 'border-red-500' : 'border-white/10'
                                        }`}
                                        placeholder={t('auth.confirm_password_placeholder') || 'Confirm new password'}
                                        disabled={loading}
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                        disabled={loading}
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.confirmPassword && (
                                    <p className="text-xs text-red-400 mt-1">{errors.confirmPassword}</p>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    disabled={loading}
                                    className="px-6 py-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {t('auth.cancel') || 'Cancel'}
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-teal-500/25"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            {t('auth.changing') || 'Changing...'}
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="w-4 h-4" />
                                            {t('auth.change_password') || 'Change Password'}
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

export default ChangePasswordModal;

