import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../../config/api';
import toast from 'react-hot-toast';
import { Save, Settings, Bell, Shield, Database, Mail } from 'lucide-react';

const SettingsPanel = () => {
  const [settings, setSettings] = useState({
    system: {
      maintenanceMode: false,
      registrationEnabled: true,
      maxUsersPerInstitution: 100,
      maintenanceMessage: ''
    },
    notifications: {
      emailNotifications: true,
      newUserAlerts: true,
      paymentAlerts: true,
      systemAlerts: true,
      adminEmail: ''
    },
    security: {
      sessionTimeout: 30,
      requireEmailVerification: true,
      enable2FA: false,
      maxLoginAttempts: 5,
      passwordMinLength: 8
    },
    platform: {
      siteName: '',
      siteDescription: '',
      supportEmail: '',
      supportPhone: ''
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/super-admin/settings');
      if (response.data.success) {
        const fetchedSettings = response.data.data;
        setSettings({
          system: {
            maintenanceMode: fetchedSettings.system?.maintenanceMode || false,
            registrationEnabled: fetchedSettings.system?.registrationEnabled !== false,
            maxUsersPerInstitution: fetchedSettings.system?.maxUsersPerInstitution || 100,
            maintenanceMessage: fetchedSettings.system?.maintenanceMessage || ''
          },
          notifications: {
            emailNotifications: fetchedSettings.notifications?.emailNotifications !== false,
            newUserAlerts: fetchedSettings.notifications?.newUserAlerts !== false,
            paymentAlerts: fetchedSettings.notifications?.paymentAlerts !== false,
            systemAlerts: fetchedSettings.notifications?.systemAlerts !== false,
            adminEmail: fetchedSettings.notifications?.adminEmail || ''
          },
          security: {
            sessionTimeout: fetchedSettings.security?.sessionTimeout || 30,
            requireEmailVerification: fetchedSettings.security?.requireEmailVerification !== false,
            enable2FA: fetchedSettings.security?.enable2FA || false,
            maxLoginAttempts: fetchedSettings.security?.maxLoginAttempts || 5,
            passwordMinLength: fetchedSettings.security?.passwordMinLength || 8
          },
          platform: {
            siteName: fetchedSettings.platform?.siteName || '',
            siteDescription: fetchedSettings.platform?.siteDescription || '',
            supportEmail: fetchedSettings.platform?.supportEmail || '',
            supportPhone: fetchedSettings.platform?.supportPhone || ''
          }
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (category, key, value) => {
    setSettings(prev => {
      // Create a completely new object to ensure React detects the change
      return {
        ...prev,
        [category]: {
          ...prev[category],
          [key]: value
        }
      };
    });
  };

  const handleSave = async (category) => {
    setSaving(true);
    try {
      const payload = {
        [category]: settings[category]
      };
      
      const response = await api.put('/super-admin/settings', payload);
      
      if (response.data.success) {
        toast.success(`${category.charAt(0).toUpperCase() + category.slice(1)} settings saved successfully`);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save settings';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const SettingSection = ({ title, icon: Icon, category, children }) => (
    <div className="bg-surface border border-hairline rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-ink">{title}</h3>
        </div>
        <button
          onClick={() => handleSave(category)}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-full hover:bg-primary-active transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          Save
        </button>
      </div>
      {children}
    </div>
  );

  const ToggleSwitch = ({ label, description, checked, onChange }) => (
    <div className="flex items-start justify-between py-4 border-b border-hairline last:border-0">
      <div className="flex-1">
        <label className="text-sm font-medium text-ink-secondary">{label}</label>
        {description && (
          <p className="text-xs text-ink-faint mt-1">{description}</p>
        )}
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-[#dddddd] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#dddddd] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
      </label>
    </div>
  );

  const NumberInput = ({ label, description, value, onChange, min, max }) => {
    const handleNumberChange = (e) => {
      const inputValue = e.target.value;
      // If empty, set to min value
      if (inputValue === '') {
        onChange(min);
        return;
      }
      const numValue = parseInt(inputValue, 10);
      if (!isNaN(numValue)) {
        // Clamp value between min and max
        const clampedValue = Math.min(Math.max(numValue, min), max);
        onChange(clampedValue);
      }
    };

    return (
      <div className="py-4 border-b border-hairline last:border-0">
        <label className="block text-sm font-medium text-ink-secondary mb-2">
          {label}
        </label>
        {description && (
          <p className="text-xs text-ink-faint mb-2">{description}</p>
        )}
        <input
          type="number"
          value={value}
          onChange={handleNumberChange}
          onBlur={(e) => {
            // Ensure value is within bounds when user leaves the field
            const inputValue = e.target.value;
            if (inputValue === '' || isNaN(parseInt(inputValue, 10))) {
              onChange(min);
            } else {
              const numValue = parseInt(inputValue, 10);
              if (numValue < min) {
                onChange(min);
              } else if (numValue > max) {
                onChange(max);
              }
            }
          }}
          min={min}
          max={max}
          className="w-full px-3 py-2.5 bg-surface border border-[#dddddd] rounded-xs text-ink text-[15px] focus:shadow-[var(--shadow-level-1)] focus:border-primary outline-none transition-shadow duration-150"
        />
      </div>
    );
  };

  const TextInput = ({ label, description, value, onChange, placeholder, maxLength }) => (
    <div className="py-4 border-b border-hairline last:border-0">
      <label className="block text-sm font-medium text-ink-secondary mb-2">
        {label}
      </label>
      {description && (
        <p className="text-xs text-ink-faint mb-2">{description}</p>
      )}
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full px-3 py-2.5 bg-surface border border-[#dddddd] rounded-xs text-ink text-[15px] placeholder:text-ink-faint focus:shadow-[var(--shadow-level-1)] focus:border-primary outline-none transition-shadow duration-150"
      />
    </div>
  );

  const TextAreaInput = ({ label, description, value, onChange, placeholder, maxLength, rows = 3 }) => (
    <div className="py-4 border-b border-hairline last:border-0">
      <label className="block text-sm font-medium text-ink-secondary mb-2">
        {label}
      </label>
      {description && (
        <p className="text-xs text-ink-faint mb-2">{description}</p>
      )}
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        className="w-full px-3 py-2.5 bg-surface border border-[#dddddd] rounded-xs text-ink text-[15px] placeholder:text-ink-faint focus:shadow-[var(--shadow-level-1)] focus:border-primary outline-none transition-shadow duration-150 resize-none"
      />
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-ink">Settings</h2>
        <p className="text-ink-muted text-sm mt-1">Manage system configuration and preferences</p>
      </div>

      {/* System Settings */}
      <SettingSection title="System Settings" icon={Settings} category="system">
        <ToggleSwitch
          label="Maintenance Mode"
          description="Enable maintenance mode to restrict access"
          checked={settings.system.maintenanceMode}
          onChange={(value) => handleChange('system', 'maintenanceMode', value)}
        />
        <ToggleSwitch
          label="Registration Enabled"
          description="Allow new user registrations"
          checked={settings.system.registrationEnabled}
          onChange={(value) => handleChange('system', 'registrationEnabled', value)}
        />
        <NumberInput
          label="Max Users Per Institution"
          description="Maximum number of users allowed per institution"
          value={settings.system.maxUsersPerInstitution}
          onChange={(value) => handleChange('system', 'maxUsersPerInstitution', value)}
          min={1}
          max={10000}
        />
        <TextAreaInput
          label="Maintenance Message"
          description="Message displayed to users when maintenance mode is enabled"
          value={settings.system.maintenanceMessage}
          onChange={(value) => handleChange('system', 'maintenanceMessage', value)}
          placeholder="The system is currently under maintenance. Please check back later."
          maxLength={500}
          rows={3}
        />
      </SettingSection>

      {/* Notification Settings */}
      <SettingSection title="Notification Settings" icon={Bell} category="notifications">
        <ToggleSwitch
          label="Email Notifications"
          description="Enable email notifications for admin alerts"
          checked={settings.notifications.emailNotifications}
          onChange={(value) => handleChange('notifications', 'emailNotifications', value)}
        />
        <ToggleSwitch
          label="New User Alerts"
          description="Get notified when new users register"
          checked={settings.notifications.newUserAlerts}
          onChange={(value) => handleChange('notifications', 'newUserAlerts', value)}
        />
        <ToggleSwitch
          label="Payment Alerts"
          description="Get notified about payment transactions"
          checked={settings.notifications.paymentAlerts}
          onChange={(value) => handleChange('notifications', 'paymentAlerts', value)}
        />
        <ToggleSwitch
          label="System Alerts"
          description="Get notified about system issues"
          checked={settings.notifications.systemAlerts}
          onChange={(value) => handleChange('notifications', 'systemAlerts', value)}
        />
        <TextInput
          label="Admin Email"
          description="Email address to receive admin notifications"
          value={settings.notifications.adminEmail}
          onChange={(value) => handleChange('notifications', 'adminEmail', value)}
          placeholder="admin@inavora.com"
        />
      </SettingSection>

      {/* Security Settings */}
      <SettingSection title="Security Settings" icon={Shield} category="security">
        <NumberInput
          label="Session Timeout (minutes)"
          description="Auto-logout after inactivity"
          value={settings.security.sessionTimeout}
          onChange={(value) => handleChange('security', 'sessionTimeout', value)}
          min={5}
          max={480}
        />
        <ToggleSwitch
          label="Require Email Verification"
          description="Users must verify their email before accessing the platform"
          checked={settings.security.requireEmailVerification}
          onChange={(value) => handleChange('security', 'requireEmailVerification', value)}
        />
        <ToggleSwitch
          label="Enable 2FA"
          description="Enable two-factor authentication for super admin"
          checked={settings.security.enable2FA}
          onChange={(value) => handleChange('security', 'enable2FA', value)}
        />
        <NumberInput
          label="Max Login Attempts"
          description="Maximum failed login attempts before account lockout"
          value={settings.security.maxLoginAttempts}
          onChange={(value) => handleChange('security', 'maxLoginAttempts', value)}
          min={3}
          max={10}
        />
        <NumberInput
          label="Password Min Length"
          description="Minimum required password length"
          value={settings.security.passwordMinLength}
          onChange={(value) => handleChange('security', 'passwordMinLength', value)}
          min={6}
          max={32}
        />
      </SettingSection>

      {/* Platform Settings */}
      <SettingSection title="Platform Settings" icon={Database} category="platform">
        <TextInput
          label="Site Name"
          description="Name of the platform"
          value={settings.platform.siteName}
          onChange={(value) => handleChange('platform', 'siteName', value)}
          placeholder="Presento"
          maxLength={100}
        />
        <TextAreaInput
          label="Site Description"
          description="Brief description of the platform"
          value={settings.platform.siteDescription}
          onChange={(value) => handleChange('platform', 'siteDescription', value)}
          placeholder="Professional presentation platform"
          maxLength={500}
          rows={2}
        />
        <TextInput
          label="Support Email"
          description="Email address for customer support"
          value={settings.platform.supportEmail}
          onChange={(value) => handleChange('platform', 'supportEmail', value)}
          placeholder="support@inavora.com"
        />
        <TextInput
          label="Support Phone"
          description="Phone number for customer support"
          value={settings.platform.supportPhone}
          onChange={(value) => handleChange('platform', 'supportPhone', value)}
          placeholder="+91 9043411110"
          maxLength={20}
        />
      </SettingSection>
    </div>
  );
};

export default SettingsPanel;

