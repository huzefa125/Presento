import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Building, Lock, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { getBrandingColors, getRgbaColor, hexToRgb } from '../../utils/brandingColors';

const ProfileModal = ({ isOpen, onClose, institution, onUpdateProfile, onChangePassword, loading }) => {
    const { t } = useTranslation();
    const { primaryColor, secondaryColor } = getBrandingColors(institution);
    const [activeTab, setActiveTab] = useState('profile');
    // Profile data is now read-only, no need for state
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState({});

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

    // Profile fields are read-only, no need for change handlers

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

    const validateProfile = () => {
        // No validation needed since all fields are read-only
        // This function is kept for consistency but will always return true
        setErrors({});
        return true;
    };

    const validatePassword = () => {
        const newErrors = {};
        
        if (!passwordData.currentPassword) {
            newErrors.currentPassword = t('institution_admin.current_password_required') || 'Current password is required';
        }
        
        if (!passwordData.newPassword) {
            newErrors.newPassword = t('institution_admin.new_password_required') || 'New password is required';
        } else if (passwordData.newPassword.length < 8) {
            newErrors.newPassword = t('institution_admin.password_min_length') || 'Password must be at least 8 characters';
        }
        
        if (!passwordData.confirmPassword) {
            newErrors.confirmPassword = t('institution_admin.confirm_password_required') || 'Please confirm your new password';
        } else if (passwordData.newPassword !== passwordData.confirmPassword) {
            newErrors.confirmPassword = t('institution_admin.passwords_not_match') || 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        // Since all fields are read-only, no need to submit
        // This form submission is disabled
        return;
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (!validatePassword()) return;

        try {
            await onChangePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });

            // Reset password form on success
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            setErrors({});
            
            // Success toast is shown by the parent component
        } catch (error) {
            // Error toast is shown by the parent component
            // Set specific field errors for better UX
            const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'An error occurred';
            
            if (errorMessage.toLowerCase().includes('current password') || errorMessage.toLowerCase().includes('incorrect')) {
                setErrors({ currentPassword: errorMessage });
            } else if (errorMessage.toLowerCase().includes('new password') || errorMessage.toLowerCase().includes('at least')) {
                setErrors({ newPassword: errorMessage });
            } else {
                // Generic error - could be validation or server error
                setErrors({ newPassword: errorMessage });
            }
        }
    };

    const handleClose = () => {
        setActiveTab('profile');
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
                        className="bg-surface rounded-xl shadow-[var(--shadow-level-2)] w-full max-w-2xl border border-hairline"
                    >
                        <div className="p-6 border-b border-hairline flex items-center justify-between">
                            <h2 className="text-xl sm:text-2xl font-bold text-ink">
                                {t('institution_admin.profile') || 'Profile'}
                            </h2>
                            <button
                                onClick={handleClose}
                                className="p-2 hover:bg-canvas-soft rounded-md transition-colors"
                            >
                                <X className="w-5 h-5 text-ink-muted" />
                            </button>
                        </div>

                        {/* Tab Navigation */}
                        <div className="flex gap-2 px-6 pt-4 border-b border-hairline">
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                                    activeTab === 'profile'
                                        ? ''
                                        : 'text-ink-muted border-transparent hover:text-ink'
                                }`}
                                style={activeTab === 'profile' ? {
                                    color: secondaryColor,
                                    borderColor: secondaryColor
                                } : {}}
                            >
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    {t('institution_admin.profile_info') || 'Profile Information'}
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('password')}
                                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                                    activeTab === 'password'
                                        ? ''
                                        : 'text-ink-muted border-transparent hover:text-ink'
                                }`}
                                style={activeTab === 'password' ? {
                                    color: secondaryColor,
                                    borderColor: secondaryColor
                                } : {}}
                            >
                                <div className="flex items-center gap-2">
                                    <Lock className="w-4 h-4" />
                                    {t('institution_admin.change_password') || 'Change Password'}
                                </div>
                            </button>
                        </div>

                        <div className="p-6">
                            {/* Profile Information Tab */}
                            {activeTab === 'profile' && (
                                <form onSubmit={handleProfileSubmit} className="space-y-6">
                                    {/* Institution Name (Read-only) */}
                                    <div>
                                        <label className="block text-sm font-medium text-ink-secondary mb-2 flex items-center gap-2">
                                            <Building className="w-4 h-4 text-accent-teal" />
                                            {t('institution_admin.institution_name') || 'Institution Name'}
                                        </label>
                                        <input
                                            type="text"
                                            value={institution?.name || ''}
                                            disabled
                                            className="w-full px-4 py-2 bg-canvas-soft border border-hairline rounded-xs text-ink-muted cursor-not-allowed"
                                        />
                                    </div>

                                    {/* Admin Name (Read-only) */}
                                    <div>
                                        <label className="block text-sm font-medium text-ink-secondary mb-2 flex items-center gap-2">
                                            <User className="w-4 h-4" style={{ color: secondaryColor }} />
                                            {t('institution_admin.admin_name') || 'Admin Name'}
                                        </label>
                                        <input
                                            type="text"
                                            value={institution?.adminName || ''}
                                            disabled
                                            className="w-full px-4 py-2 bg-canvas-soft border border-hairline rounded-xs text-ink-muted cursor-not-allowed"
                                        />
                                    </div>

                                    {/* Institution Email (Read-only) */}
                                    <div>
                                        <label className="block text-sm font-medium text-ink-secondary mb-2 flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-ink-muted" />
                                            {t('institution_admin.institution_email') || 'Institution Email'}
                                        </label>
                                        <input
                                            type="email"
                                            value={institution?.email || ''}
                                            disabled
                                            className="w-full px-4 py-2 bg-canvas-soft border border-hairline rounded-xs text-ink-muted cursor-not-allowed"
                                        />
                                    </div>

                                    {/* No save button needed since all fields are read-only */}
                                </form>
                            )}

                            {/* Change Password Tab */}
                            {activeTab === 'password' && (
                                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                                    {/* Current Password */}
                                    <div>
                                        <label className="block text-sm font-medium text-ink-secondary mb-2 flex items-center gap-2">
                                            <Lock className="w-4 h-4" style={{ color: secondaryColor }} />
                                            {t('institution_admin.current_password') || 'Current Password'}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showCurrentPassword ? 'text' : 'password'}
                                                value={passwordData.currentPassword}
                                                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                                                className={`w-full px-4 py-2 pr-10 bg-surface border rounded-xs text-ink placeholder:text-ink-faint outline-none transition-shadow duration-150 focus:shadow-[var(--shadow-level-1)] focus:border-primary ${
                                                    errors.currentPassword ? 'border-red-500' : 'border-[#dddddd]'
                                                }`}
                                                placeholder={t('institution_admin.current_password_placeholder') || 'Enter current password'}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-ink-muted hover:text-ink transition-colors"
                                            >
                                                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {errors.currentPassword && (
                                            <p className="text-xs text-red-600 mt-1">{errors.currentPassword}</p>
                                        )}
                                    </div>

                                    {/* New Password */}
                                    <div>
                                        <label className="block text-sm font-medium text-ink-secondary mb-2 flex items-center gap-2">
                                            <Lock className="w-4 h-4" style={{ color: secondaryColor }} />
                                            {t('institution_admin.new_password') || 'New Password'}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showNewPassword ? 'text' : 'password'}
                                                value={passwordData.newPassword}
                                                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                                                className={`w-full px-4 py-2 pr-10 bg-surface border rounded-xs text-ink placeholder:text-ink-faint outline-none transition-shadow duration-150 focus:shadow-[var(--shadow-level-1)] focus:border-primary ${
                                                    errors.newPassword ? 'border-red-500' : 'border-[#dddddd]'
                                                }`}
                                                placeholder={t('institution_admin.new_password_placeholder') || 'Enter new password'}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-ink-muted hover:text-ink transition-colors"
                                            >
                                                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {errors.newPassword && (
                                            <p className="text-xs text-red-600 mt-1">{errors.newPassword}</p>
                                        )}
                                        <p className="text-xs text-ink-muted mt-1">
                                            {t('institution_admin.password_min_8_chars') || 'Password must be at least 8 characters long'}
                                        </p>
                                    </div>

                                    {/* Confirm Password */}
                                    <div>
                                        <label className="block text-sm font-medium text-ink-secondary mb-2 flex items-center gap-2">
                                            <Lock className="w-4 h-4" style={{ color: secondaryColor }} />
                                            {t('institution_admin.confirm_password') || 'Confirm New Password'}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                value={passwordData.confirmPassword}
                                                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                                                className={`w-full px-4 py-2 pr-10 bg-surface border rounded-xs text-ink placeholder:text-ink-faint outline-none transition-shadow duration-150 focus:shadow-[var(--shadow-level-1)] focus:border-primary ${
                                                    errors.confirmPassword ? 'border-red-500' : 'border-[#dddddd]'
                                                }`}
                                                placeholder={t('institution_admin.confirm_password_placeholder') || 'Confirm new password'}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-ink-muted hover:text-ink transition-colors"
                                            >
                                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {errors.confirmPassword && (
                                            <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>
                                        )}
                                    </div>

                                    <div className="flex justify-end pt-4 border-t border-hairline">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex items-center gap-2 px-6 py-3 text-on-primary font-medium rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            style={{ backgroundColor: secondaryColor }}
                                            onMouseEnter={(e) => {
                                                if (!e.target.disabled) {
                                                    const rgb = hexToRgb(secondaryColor);
                                                    if (rgb) {
                                                        e.target.style.backgroundColor = `rgb(${Math.max(0, rgb.r - 20)}, ${Math.max(0, rgb.g - 20)}, ${Math.max(0, rgb.b - 20)})`;
                                                    }
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.backgroundColor = secondaryColor;
                                            }}
                                        >
                                            <Lock className="w-4 h-4" />
                                            {loading ? (t('institution_admin.changing') || 'Changing...') : (t('institution_admin.change_password') || 'Change Password')}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ProfileModal;

