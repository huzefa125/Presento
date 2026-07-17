import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import {
    Settings as SettingsIcon,
    Save,
    Shield,
    Sparkles,
    Download,
    Image,
    BarChart3,
    Lock,
    Clock,
    Mail,
    Info,
    AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getBrandingColors, getRgbaColor, hexToRgb } from '../utils/brandingColors';

const Settings = ({ 
    settings, 
    setSettings, 
    securitySettings, 
    setSecuritySettings, 
    loading, 
    onUpdateSettings, 
    onUpdateSecuritySettings,
    institution
}) => {
    const { t } = useTranslation();
    const { primaryColor, secondaryColor } = getBrandingColors(institution);
    const [activeTab, setActiveTab] = useState('general');

    // Initialize settings from institution when available
    useEffect(() => {
        if (institution) {
            // Initialize general settings
            if (institution.settings) {
                setSettings(prev => ({
                    ...prev,
                    aiFeaturesEnabled: institution.settings.aiFeaturesEnabled ?? true,
                    exportEnabled: institution.settings.exportEnabled ?? true,
                    watermarkEnabled: institution.settings.watermarkEnabled ?? false,
                    analyticsEnabled: institution.settings.analyticsEnabled ?? true
                }));
            }
            // Initialize security settings
            if (institution.securitySettings) {
                setSecuritySettings(prev => ({
                    ...prev,
                    twoFactorEnabled: institution.securitySettings.twoFactorEnabled ?? false,
                    passwordMinLength: institution.securitySettings.passwordMinLength ?? 8,
                    passwordRequireUppercase: institution.securitySettings.passwordRequireUppercase ?? true,
                    passwordRequireLowercase: institution.securitySettings.passwordRequireLowercase ?? true,
                    passwordRequireNumbers: institution.securitySettings.passwordRequireNumbers ?? true,
                    passwordRequireSpecialChars: institution.securitySettings.passwordRequireSpecialChars ?? false,
                    sessionTimeout: institution.securitySettings.sessionTimeout ?? 30,
                    requireEmailVerification: institution.securitySettings.requireEmailVerification ?? true
                }));
            }
        }
    }, [institution]);

    const handleSettingChange = (key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleSecuritySettingChange = (key, value) => {
        setSecuritySettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleGeneralSettingsSubmit = async (e) => {
        e.preventDefault();
        await onUpdateSettings(e);
    };

    const handleSecuritySettingsSubmit = async (e) => {
        e.preventDefault();
        await onUpdateSecuritySettings();
    };

    // Toggle Switch Component
    const ToggleSwitch = ({ enabled, onChange, label, description, icon: Icon }) => (
        <div className="flex items-start justify-between p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors">
            <div className="flex items-start gap-3 flex-1">
                {Icon && (
                    <div className="p-2 rounded-lg mt-0.5" style={{ backgroundColor: getRgbaColor(secondaryColor, 0.2) }}>
                        <Icon className="w-4 h-4" style={{ color: secondaryColor }} />
                    </div>
                )}
                <div className="flex-1">
                    <label className="block text-sm font-medium text-white mb-1 cursor-pointer" onClick={() => onChange(!enabled)}>
                        {label}
                    </label>
                    {description && (
                        <p className="text-xs text-gray-400">{description}</p>
                    )}
                </div>
            </div>
            <button
                type="button"
                onClick={() => onChange(!enabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0f172a] ${
                    enabled ? '' : 'bg-gray-600'
                }`}
                style={enabled ? { backgroundColor: secondaryColor } : {}}
                onFocus={(e) => {
                    e.target.style.boxShadow = `0 0 0 2px ${getRgbaColor(secondaryColor, 0.2)}`;
                }}
                onBlur={(e) => {
                    e.target.style.boxShadow = 'none';
                }}
            >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
            </button>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8"
        >
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-white mb-2">
                    {t('institution_admin.settings_title')}
                </h1>
                <p className="text-gray-400">
                    {t('institution_admin.settings_description')}
                </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 border-b border-white/10">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                        activeTab === 'general'
                            ? ''
                            : 'text-gray-400 border-transparent hover:text-white'
                    }`}
                    style={activeTab === 'general' ? {
                        color: secondaryColor,
                        borderColor: secondaryColor
                    } : {}}
                >
                    <div className="flex items-center gap-2">
                        <SettingsIcon className="w-4 h-4" />
                        {t('institution_admin.general_settings') || 'General Settings'}
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('security')}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                        activeTab === 'security'
                            ? ''
                            : 'text-gray-400 border-transparent hover:text-white'
                    }`}
                    style={activeTab === 'security' ? {
                        color: secondaryColor,
                        borderColor: secondaryColor
                    } : {}}
                >
                    <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        {t('institution_admin.security_settings')}
                    </div>
                </button>
            </div>

            {/* General Settings Tab */}
            {activeTab === 'general' && (
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm"
                >
                    <form onSubmit={handleGeneralSettingsSubmit}>
                        <div className="space-y-4 mb-6">
                            <ToggleSwitch
                                enabled={settings?.aiFeaturesEnabled ?? true}
                                onChange={(value) => handleSettingChange('aiFeaturesEnabled', value)}
                                label={t('institution_admin.ai_features')}
                                description={t('institution_admin.ai_features_desc')}
                                icon={Sparkles}
                            />

                            <ToggleSwitch
                                enabled={settings?.exportEnabled ?? true}
                                onChange={(value) => handleSettingChange('exportEnabled', value)}
                                label={t('institution_admin.export_results')}
                                description={t('institution_admin.export_results_desc')}
                                icon={Download}
                            />

                            <ToggleSwitch
                                enabled={settings?.watermarkEnabled ?? false}
                                onChange={(value) => handleSettingChange('watermarkEnabled', value)}
                                label={t('institution_admin.watermark')}
                                description={t('institution_admin.watermark_desc')}
                                icon={Image}
                            />

                            <ToggleSwitch
                                enabled={settings?.analyticsEnabled ?? true}
                                onChange={(value) => handleSettingChange('analyticsEnabled', value)}
                                label={t('institution_admin.advanced_analytics')}
                                description={t('institution_admin.advanced_analytics_desc')}
                                icon={BarChart3}
                            />
                        </div>

                        <div className="flex justify-end pt-4 border-t border-white/10">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-3 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                                <Save className="w-4 h-4" />
                                {loading ? (t('institution_admin.saving') || 'Saving...') : (t('institution_admin.save_settings') || 'Save Settings')}
                            </button>
                        </div>
                    </form>
                </motion.div>
            )}

            {/* Security Settings Tab */}
            {activeTab === 'security' && (
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                >
                    {/* Two-Factor Authentication */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg" style={{ backgroundColor: getRgbaColor(primaryColor, 0.2) }}>
                                <Lock className="w-5 h-5" style={{ color: primaryColor }} />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">
                                    {t('institution_admin.two_factor_auth')}
                                </h3>
                                <p className="text-sm text-gray-400">
                                    {t('institution_admin.two_factor_auth_desc')}
                                </p>
                            </div>
                        </div>
                        <ToggleSwitch
                            enabled={securitySettings?.twoFactorEnabled ?? false}
                            onChange={(value) => handleSecuritySettingChange('twoFactorEnabled', value)}
                            label={t('institution_admin.enable_2fa') || 'Enable Two-Factor Authentication'}
                            description={t('institution_admin.enable_2fa_desc') || 'Require users to use two-factor authentication for enhanced security'}
                        />
                    </div>

                    {/* Password Policy */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-purple-500/20 rounded-lg">
                                <Shield className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">
                                    {t('institution_admin.password_policy')}
                                </h3>
                                <p className="text-sm text-gray-400">
                                    {t('institution_admin.password_policy_desc') || 'Configure password requirements for institution users'}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                                {/* Minimum Password Length */}
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        {t('institution_admin.min_password_length')}
                                    </label>
                                    <input
                                        type="number"
                                        min="6"
                                        max="32"
                                        value={securitySettings.passwordMinLength || 8}
                                        onChange={(e) => {
                                            const value = parseInt(e.target.value) || 8;
                                            const clampedValue = Math.min(Math.max(value, 6), 32);
                                            handleSecuritySettingChange('passwordMinLength', clampedValue);
                                        }}
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none"
                                        onFocus={(e) => {
                                            e.target.style.borderColor = secondaryColor;
                                            e.target.style.boxShadow = `0 0 0 2px ${getRgbaColor(secondaryColor, 0.2)}`;
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                            e.target.style.boxShadow = 'none';
                                            // Ensure value is within bounds on blur
                                            const value = parseInt(e.target.value) || 8;
                                            const clampedValue = Math.min(Math.max(value, 6), 32);
                                            if (value !== clampedValue) {
                                                handleSecuritySettingChange('passwordMinLength', clampedValue);
                                            }
                                        }}
                                    />
                                    <p className="text-xs text-gray-400 mt-1">
                                        {t('institution_admin.min_password_length_desc') || 'Minimum length between 6 and 32 characters'}
                                    </p>
                                </div>

                                {/* Password Requirements */}
                                <div className="space-y-3">
                                    <ToggleSwitch
                                        enabled={securitySettings?.passwordRequireUppercase ?? true}
                                        onChange={(value) => handleSecuritySettingChange('passwordRequireUppercase', value)}
                                        label={t('institution_admin.require_uppercase')}
                                        description={t('institution_admin.require_uppercase_desc') || 'Passwords must contain at least one uppercase letter'}
                                    />

                                    <ToggleSwitch
                                        enabled={securitySettings?.passwordRequireLowercase ?? true}
                                        onChange={(value) => handleSecuritySettingChange('passwordRequireLowercase', value)}
                                        label={t('institution_admin.require_lowercase')}
                                        description={t('institution_admin.require_lowercase_desc') || 'Passwords must contain at least one lowercase letter'}
                                    />

                                    <ToggleSwitch
                                        enabled={securitySettings?.passwordRequireNumbers ?? true}
                                        onChange={(value) => handleSecuritySettingChange('passwordRequireNumbers', value)}
                                        label={t('institution_admin.require_numbers')}
                                        description={t('institution_admin.require_numbers_desc') || 'Passwords must contain at least one number'}
                                    />

                                    <ToggleSwitch
                                        enabled={securitySettings?.passwordRequireSpecialChars ?? false}
                                        onChange={(value) => handleSecuritySettingChange('passwordRequireSpecialChars', value)}
                                        label={t('institution_admin.require_special_chars')}
                                        description={t('institution_admin.require_special_chars_desc') || 'Passwords must contain at least one special character (!@#$%^&*)'}
                                    />
                                </div>
                        </div>
                    </div>

                    {/* Session Timeout */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-orange-500/20 rounded-lg">
                                <Clock className="w-5 h-5 text-orange-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">
                                    {t('institution_admin.session_timeout')}
                                </h3>
                                <p className="text-sm text-gray-400">
                                    {t('institution_admin.session_timeout_desc') || 'Set how long users can remain inactive before being logged out'}
                                </p>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                {t('institution_admin.timeout_duration') || 'Timeout Duration'}
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="number"
                                    min="5"
                                    max="480"
                                    step="5"
                                    value={securitySettings.sessionTimeout || 30}
                                    onChange={(e) => {
                                        const value = parseInt(e.target.value) || 30;
                                        const clampedValue = Math.min(Math.max(value, 5), 480);
                                        handleSecuritySettingChange('sessionTimeout', clampedValue);
                                    }}
                                    className="w-32 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none"
                                    onFocus={(e) => {
                                        e.target.style.borderColor = secondaryColor;
                                        e.target.style.boxShadow = `0 0 0 2px ${getRgbaColor(secondaryColor, 0.2)}`;
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                        e.target.style.boxShadow = 'none';
                                        // Ensure value is within bounds on blur
                                        const value = parseInt(e.target.value) || 30;
                                        const clampedValue = Math.min(Math.max(value, 5), 480);
                                        if (value !== clampedValue) {
                                            handleSecuritySettingChange('sessionTimeout', clampedValue);
                                        }
                                    }}
                                />
                                <span className="text-gray-400">
                                    {(securitySettings.sessionTimeout || 30) === 1 
                                        ? t('institution_admin.minute') || 'minute'
                                        : t('institution_admin.minutes') || 'minutes'
                                    }
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                                {t('institution_admin.session_timeout_range') || 'Range: 5 to 480 minutes'}
                            </p>
                        </div>
                    </div>

                    {/* Email Verification */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-green-500/20 rounded-lg">
                                <Mail className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">
                                    {t('institution_admin.require_email_verification')}
                                </h3>
                                <p className="text-sm text-gray-400">
                                    {t('institution_admin.require_email_verification_desc')}
                                </p>
                            </div>
                        </div>
                        <ToggleSwitch
                            enabled={securitySettings?.requireEmailVerification ?? true}
                            onChange={(value) => handleSecuritySettingChange('requireEmailVerification', value)}
                            label={t('institution_admin.enable_email_verification') || 'Require Email Verification'}
                            description={t('institution_admin.enable_email_verification_desc') || 'Users must verify their email address before accessing the platform'}
                        />
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end">
                        <button
                            onClick={handleSecuritySettingsSubmit}
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-3 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                            <Save className="w-4 h-4" />
                            {loading ? (t('institution_admin.saving') || 'Saving...') : (t('institution_admin.save_security_settings') || 'Save Security Settings')}
                        </button>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
};

export default Settings;
