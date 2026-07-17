import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../../../config/api';
import { translateError } from '../../../utils/errorTranslator';

export const useInstitutionAdminData = ({ adminUserId, fetchStats }) => {
    const { t } = useTranslation();
    
    // Users state
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [usersPage, setUsersPage] = useState(1);
    const [usersPagination, setUsersPagination] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [userFilter, setUserFilter] = useState({ status: 'all', role: 'all' });
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    
    // Presentations state
    const [presentations, setPresentations] = useState([]);
    const [presentationsLoading, setPresentationsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({});
    const [presentationStatus, setPresentationStatus] = useState('all');
    const [showMyPresentations, setShowMyPresentations] = useState(false);
    
    // Analytics state
    const [analytics, setAnalytics] = useState(null);
    const [analyticsPeriod, setAnalyticsPeriod] = useState('30');
    
    // Audit Logs state
    const [auditLogs, setAuditLogs] = useState([]);
    const [auditLogsLoading, setAuditLogsLoading] = useState(false);
    
    // Branding state
    const [branding, setBranding] = useState({
        primaryColor: '#3b82f6',
        secondaryColor: '#14b8a6',
        logoUrl: ''
    });
    
    // Settings state
    const [settings, setSettings] = useState({
        aiFeaturesEnabled: true,
        exportEnabled: true,
        watermarkEnabled: false,
        analyticsEnabled: true
    });
    const [securitySettings, setSecuritySettings] = useState({
        twoFactorEnabled: false,
        passwordMinLength: 8,
        passwordRequireUppercase: true,
        passwordRequireLowercase: true,
        passwordRequireNumbers: true,
        passwordRequireSpecialChars: false,
        sessionTimeout: 30,
        requireEmailVerification: true
    });
    
    // API Management state
    const [apiKeys, setApiKeys] = useState([]);
    const [webhooks, setWebhooks] = useState([]);
    
    // Modals state
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
    const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
    const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
    const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
    
    // Payment state
    const [pendingEmails, setPendingEmails] = useState([]);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [userValidation, setUserValidation] = useState(null);
    const [newUser, setNewUser] = useState({ email: '' });
    const [loading, setLoading] = useState(false);
    
    // API Key & Webhook state
    const [newApiKey, setNewApiKey] = useState({ name: '', permissions: [] });
    const [newWebhook, setNewWebhook] = useState({ url: '', events: [], secret: '' });
    
    // Report config
    const [reportConfig, setReportConfig] = useState({
        type: 'analytics',
        format: 'pdf',
        schedule: 'none',
        email: '',
        frequency: 'weekly'
    });

    // Fetch Users
    const fetchUsers = async () => {
        setUsersLoading(true);
        try {
            const response = await api.get('/institution-admin/users', {
                params: {
                    page: usersPage,
                    limit: 15,
                    search: searchQuery
                }
            });
            if (response.data.success) {
                setUsers(response.data.data.users);
                setUsersPagination(response.data.data.pagination);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error(t('institution_admin.fetch_users_error'));
        } finally {
            setUsersLoading(false);
        }
    };

    // Fetch Presentations
    const fetchPresentations = async () => {
        setPresentationsLoading(true);
        try {
            const params = {
                page: currentPage,
                limit: 20,
                search: searchQuery,
                status: presentationStatus
            };
            
            if (showMyPresentations && adminUserId) {
                params.userId = adminUserId;
            }
            
            const response = await api.get('/institution-admin/presentations', { params });
            if (response.data.success) {
                setPresentations(response.data.data.presentations);
                setPagination(response.data.data.pagination);
            }
        } catch (error) {
            console.error('Error fetching presentations:', error);
            toast.error(t('institution_admin.fetch_presentations_error'));
        } finally {
            setPresentationsLoading(false);
        }
    };

    // Fetch Analytics
    const fetchAnalytics = async () => {
        try {
            const response = await api.get('/institution-admin/analytics', {
                params: { period: analyticsPeriod }
            });
            if (response.data.success) {
                setAnalytics(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
            toast.error(t('institution_admin.fetch_analytics_error'));
        }
    };

    // Fetch Audit Logs
    const fetchAuditLogs = async () => {
        setAuditLogsLoading(true);
        try {
            const response = await api.get('/institution-admin/audit-logs', {
                params: { 
                    startDate: dateRange.start,
                    endDate: dateRange.end 
                }
            });
            if (response.data.success) {
                setAuditLogs(response.data.logs || []);
            }
        } catch (error) {
            console.error('Error fetching audit logs:', error);
            toast.error(translateError(error, t, 'institution_admin.fetch_audit_logs_error'));
        } finally {
            setAuditLogsLoading(false);
        }
    };

    // Fetch Branding
    const fetchBranding = async () => {
        try {
            const response = await api.get('/institution-admin/verify');
            if (response.data.success && response.data.institution?.branding) {
                setBranding({
                    primaryColor: response.data.institution.branding.primaryColor || '#3b82f6',
                    secondaryColor: response.data.institution.branding.secondaryColor || '#14b8a6',
                    logoUrl: response.data.institution.branding.logoUrl || ''
                });
            }
        } catch (error) {
            console.error('Error fetching branding:', error);
        }
    };

    // Extract emails helper
    const extractEmails = (text) => {
        if (!text || !text.trim()) return [];
        const emailRegex = /[^\s,]+@[^\s,]+\.[^\s,]+/g;
        const matches = text.match(emailRegex) || [];
        const uniqueEmails = [...new Set(matches.map(email => email.toLowerCase().trim()))];
        return uniqueEmails.filter(email => email.includes('@') && email.includes('.'));
    };

    // Handle Add User
    const handleAddUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        const emails = extractEmails(newUser.email);
        
        if (emails.length === 0) {
            toast.error(t('institution_admin.no_valid_emails') || 'Please enter at least one valid email address.');
            setLoading(false);
            return;
        }

        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        for (let i = 0; i < emails.length; i++) {
            const email = emails[i];
            try {
                const response = await api.post('/institution-admin/users', { email });
                if (response.data.success) {
                    successCount++;
                }
            } catch (error) {
                errorCount++;
                let errorMessage = '';
                
                if (error.response?.status === 404 && error.response?.data?.code === 'USER_NOT_FOUND') {
                    errorMessage = t('institution_admin.user_not_found') || 'User account not found.';
                } else if (error.response?.status === 400 && error.response?.data?.code === 'SUBSCRIPTION_INACTIVE') {
                    errorMessage = t('institution_admin.subscription_inactive') || 'Subscription is not active.';
                    errors.push(`${email}: ${errorMessage}`);
                    break;
                } else if (error.response?.status === 400 && error.response?.data?.code === 'USER_IN_OTHER_INSTITUTION') {
                    errorMessage = t('institution_admin.user_in_other_institution') || 'User belongs to another institution.';
                } else if (error.response?.status === 400 && error.response?.data?.code === 'DUPLICATE_ENTRY') {
                    errorMessage = t('institution_admin.duplicate_entry');
                } else if (error.response?.status === 400 && error.response?.data?.code === 'LIMIT_REACHED') {
                    const remainingEmails = emails.slice(i);
                    await validateAndShowPaymentModal(remainingEmails, errors);
                    setLoading(false);
                    return;
                } else {
                    errorMessage = translateError(error, t, 'institution_admin.add_user_error') || 'Failed to add user.';
                }
                
                if (errorMessage) {
                    errors.push(`${email}: ${errorMessage}`);
                }
            }
        }

        if (successCount > 0) {
            if (emails.length === 1) {
                toast.success(t('institution_admin.user_added_success'));
            } else {
                toast.success(`${successCount} user(s) added successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
            }
        }

        if (errorCount > 0 && successCount === 0) {
            if (errors.length > 0 && errors.length <= 3) {
                errors.forEach(err => toast.error(err));
            } else {
                toast.error(`${errorCount} user(s) failed to add. Check console for details.`);
                console.error('Bulk add errors:', errors);
            }
        }

        setNewUser({ email: '' });
        setIsAddUserModalOpen(false);
        fetchUsers();
        fetchStats();
        setLoading(false);
    };

    // Validate and show payment modal
    const validateAndShowPaymentModal = async (emails) => {
        try {
            const validationResponse = await api.post('/institution-admin/users/validate-before-payment', {
                emails: emails
            });

            if (validationResponse.data.success) {
                const validation = validationResponse.data.data;
                setUserValidation(validation);

                const newUserEmails = validation.newUsers.map(u => u.email);
                
                if (validation.existingUsers.length > 0) {
                    const existingEmails = validation.existingUsers.map(u => u.email).join(', ');
                    toast.warning(t('institution_admin.users_already_exist', { 
                        count: validation.existingUsers.length, 
                        emails: existingEmails 
                    }));
                }

                if (validation.notFoundUsers.length > 0) {
                    const notFoundEmails = validation.notFoundUsers.join(', ');
                    toast.error(t('institution_admin.users_not_found', { 
                        count: validation.notFoundUsers.length, 
                        emails: notFoundEmails 
                    }));
                }

                if (validation.otherInstitutionUsers.length > 0) {
                    const otherInstEmails = validation.otherInstitutionUsers.map(u => u.email).join(', ');
                    toast.error(t('institution_admin.users_other_institution', { 
                        count: validation.otherInstitutionUsers.length, 
                        emails: otherInstEmails 
                    }));
                }

                if (newUserEmails.length > 0) {
                    setPendingEmails(newUserEmails);
                    setIsAddUserModalOpen(false);
                    setIsPaymentModalOpen(true);
                } else {
                    setIsAddUserModalOpen(false);
                    if (validation.existingUsers.length === emails.length) {
                        toast.info(t('institution_admin.all_users_exist'));
                    } else {
                        toast.error(t('institution_admin.no_valid_users_to_add'));
                    }
                }
            } else {
                throw new Error('Validation failed');
            }
        } catch (error) {
            console.error('User validation error:', error);
            toast.warning(t('institution_admin.validation_failed_fallback') || 'Could not validate users. Proceeding with payment for all users.');
            setPendingEmails(emails);
            setIsAddUserModalOpen(false);
            setIsPaymentModalOpen(true);
        }
    };

    // Handle Payment
    const handlePayment = async () => {
        if (pendingEmails.length === 0) {
            toast.error(t('institution_admin.no_users_to_add'));
            return;
        }

        setPaymentLoading(true);

        try {
            let retries = 0;
            while (!window.Razorpay && retries < 10) {
                await new Promise(resolve => setTimeout(resolve, 100));
                retries++;
            }

            if (!window.Razorpay) {
                const script = document.createElement('script');
                script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                script.async = true;
                
                await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error('Razorpay script loading timeout'));
                    }, 10000);
                    
                    script.onload = () => {
                        clearTimeout(timeout);
                        if (window.Razorpay) {
                            resolve();
                        } else {
                            reject(new Error('Razorpay failed to load'));
                        }
                    };
                    script.onerror = () => {
                        clearTimeout(timeout);
                        reject(new Error('Failed to load Razorpay script'));
                    };
                    
                    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
                    if (existingScript) {
                        clearTimeout(timeout);
                        if (window.Razorpay) {
                            resolve();
                        } else {
                            setTimeout(() => {
                                if (window.Razorpay) {
                                    resolve();
                                } else {
                                    reject(new Error('Razorpay failed to initialize'));
                                }
                            }, 1000);
                        }
                    } else {
                        document.body.appendChild(script);
                    }
                });
            }

            const response = await api.post('/institution-admin/users/create-payment', {
                emails: pendingEmails
            });

            if (response.data.success) {
                if (!response.data.orderId || !response.data.keyId) {
                    throw new Error('Invalid payment response: missing orderId or keyId');
                }

                if (!window.Razorpay) {
                    throw new Error('Razorpay SDK not loaded. Please refresh the page and try again.');
                }

                const options = {
                    key: response.data.keyId,
                    amount: response.data.amount,
                    currency: response.data.currency || 'INR',
                    name: 'Inavora',
                    description: `Add ${response.data.numberOfUsers} additional user(s)`,
                    order_id: response.data.orderId,
                    handler: async function (paymentResponse) {
                        try {
                            setPaymentLoading(true);
                            
                            const verifyResponse = await api.post('/institution-admin/users/verify-payment', {
                                razorpayOrderId: paymentResponse.razorpay_order_id,
                                razorpayPaymentId: paymentResponse.razorpay_payment_id,
                                razorpaySignature: paymentResponse.razorpay_signature,
                                emails: pendingEmails
                            });

                            if (verifyResponse.data.success) {
                                toast.success(t('institution_admin.payment_success', { count: verifyResponse.data.data.addedUsers.length }));
                                setIsPaymentModalOpen(false);
                                setPendingEmails([]);
                                setUserValidation(null);
                                fetchUsers();
                                fetchStats();
                            } else {
                                toast.error(verifyResponse.data.message || t('institution_admin.payment_verification_failed'));
                            }
                        } catch (error) {
                            console.error('Payment verification error:', error);
                            const errorMsg = error.response?.data?.message || error.message || t('institution_admin.payment_verification_failed');
                            toast.error(errorMsg);
                        } finally {
                            setPaymentLoading(false);
                        }
                    },
                    prefill: {
                        email: '',
                        name: ''
                    },
                    theme: {
                        color: '#14b8a6'
                    },
                    modal: {
                        ondismiss: function() {
                            setPaymentLoading(false);
                        }
                    }
                };

                const razorpay = new window.Razorpay(options);
                
                razorpay.on('payment.failed', function (response) {
                    console.error('Payment failed:', response.error);
                    const errorMsg = response.error?.description || 
                                    response.error?.reason || 
                                    response.error?.code ||
                                    t('institution_admin.payment_initiation_failed');
                    toast.error(t('institution_admin.payment_failed', { error: errorMsg }));
                    setPaymentLoading(false);
                });
                
                razorpay.open();
            } else {
                throw new Error(response.data.message || 'Failed to create payment order');
            }
        } catch (error) {
            console.error('Payment error:', error);
            let errorMessage = t('institution_admin.payment_initiation_failed');
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            toast.error(errorMessage);
            setPaymentLoading(false);
        }
    };

    // Handle Remove User
    const handleRemoveUser = async (userId) => {
        if (!window.confirm(t('institution_admin.remove_user_confirm'))) {
            return;
        }

        try {
            const response = await api.delete(`/institution-admin/users/${userId}`);
            if (response.data.success) {
                toast.success(t('institution_admin.user_removed_success'));
                fetchUsers();
                fetchStats();
            }
        } catch (error) {
            toast.error(translateError(error, t, 'institution_admin.remove_user_error'));
        }
    };

    // Handle Export
    const handleExport = async (type, format = 'json') => {
        try {
            const response = await api.get('/institution-admin/export', {
                params: { type, format },
                responseType: format === 'json' ? 'json' : 'blob'
            });
            
            if (format === 'json' && response.data.success) {
                const blob = new Blob([JSON.stringify(response.data.data, null, 2)], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `institution-${type}-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            } else if (format === 'csv' || format === 'excel') {
                const blob = new Blob([response.data], { 
                    type: format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
                });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                const extension = format === 'csv' ? 'csv' : 'xlsx';
                link.download = `institution-${type}-${new Date().toISOString().split('T')[0]}.${extension}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }
            
            toast.success(t('institution_admin.export_success', { type, format }));
        } catch (error) {
            console.error('Export error:', error);
            toast.error(translateError(error, t, 'institution_admin.export_error'));
        }
    };

    // Handle Update Branding
    const handleUpdateBranding = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        try {
            const response = await api.put('/institution-admin/branding', branding);
            if (response.data.success) {
                toast.success(t('institution_admin.branding_updated_success') || 'Branding updated successfully');
                // Update branding state with response data if provided
                if (response.data.data?.branding) {
                    setBranding({
                        primaryColor: response.data.data.branding.primaryColor || '#3b82f6',
                        secondaryColor: response.data.data.branding.secondaryColor || '#14b8a6',
                        logoUrl: response.data.data.branding.logoUrl || '',
                    });
                }
                // Refresh institution data to get updated branding
                // This will trigger a re-fetch of institution data
                return true; // Return success to trigger refresh
            }
        } catch (error) {
            toast.error(translateError(error, t, 'institution_admin.update_branding_error') || 'Failed to update branding');
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Handle Update Settings
    const handleUpdateSettings = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await api.put('/institution-admin/settings', settings);
            if (response.data.success) {
                toast.success(t('institution_admin.settings_updated_success') || 'Settings updated successfully');
                // Update settings state with response data if provided
                if (response.data.data?.settings) {
                    setSettings(response.data.data.settings);
                }
            }
        } catch (error) {
            toast.error(translateError(error, t, 'institution_admin.update_settings_error') || 'Failed to update settings');
        } finally {
            setLoading(false);
        }
    };

    // Handle Update Security Settings
    const handleUpdateSecuritySettings = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        try {
            // Validate security settings before submission
            if (securitySettings.passwordMinLength < 6 || securitySettings.passwordMinLength > 32) {
                toast.error(t('institution_admin.password_length_error') || 'Password length must be between 6 and 32 characters');
                setLoading(false);
                return;
            }
            if (securitySettings.sessionTimeout < 5 || securitySettings.sessionTimeout > 480) {
                toast.error(t('institution_admin.session_timeout_error') || 'Session timeout must be between 5 and 480 minutes');
                setLoading(false);
                return;
            }
            
            const response = await api.put('/institution-admin/security-settings', securitySettings);
            if (response.data.success) {
                toast.success(t('institution_admin.security_settings_updated') || 'Security settings updated successfully');
                // Update security settings state with response data if provided
                if (response.data.securitySettings) {
                    setSecuritySettings(response.data.securitySettings);
                }
            }
        } catch (error) {
            toast.error(translateError(error, t, 'institution_admin.security_settings_error') || 'Failed to update security settings');
        } finally {
            setLoading(false);
        }
    };

    // Handle Update Profile
    const handleUpdateProfile = async (profileData) => {
        setLoading(true);
        try {
            const response = await api.put('/institution-admin/profile', profileData);
            if (response.data.success) {
                toast.success(t('institution_admin.profile_updated_success') || 'Profile updated successfully');
                return response.data.data;
            }
        } catch (error) {
            toast.error(translateError(error, t, 'institution_admin.profile_update_error') || 'Failed to update profile');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Handle Change Password
    const handleChangePassword = async (passwordData) => {
        setLoading(true);
        try {
            const response = await api.put('/institution-admin/change-password', passwordData);
            if (response.data.success) {
                toast.success(t('institution_admin.password_changed_success') || 'Password changed successfully');
            }
        } catch (error) {
            toast.error(translateError(error, t, 'institution_admin.password_change_error') || 'Failed to change password');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Fetch API Keys
    const fetchApiKeys = async () => {
        try {
            const response = await api.get('/institution-admin/api-keys');
            if (response.data.success) {
                setApiKeys(response.data.keys || []);
            }
        } catch (error) {
            console.error('Error fetching API keys:', error);
        }
    };

    // Handle Create API Key
    const handleCreateApiKey = async () => {
        setLoading(true);
        try {
            const response = await api.post('/institution-admin/api-keys', newApiKey);
            if (response.data.success) {
                toast.success(t('institution_admin.api_key_created'));
                setIsApiKeyModalOpen(false);
                setNewApiKey({ name: '', permissions: [] });
                fetchApiKeys();
            }
        } catch (error) {
            toast.error(translateError(error, t, 'institution_admin.api_key_error'));
        } finally {
            setLoading(false);
        }
    };

    // Handle Delete API Key
    const handleDeleteApiKey = async (keyId) => {
        if (!window.confirm(t('institution_admin.delete_api_key_confirm'))) return;
        try {
            const response = await api.delete(`/institution-admin/api-keys/${keyId}`);
            if (response.data.success) {
                toast.success(t('institution_admin.api_key_deleted'));
                fetchApiKeys();
            }
        } catch (error) {
            toast.error(translateError(error, t, 'institution_admin.api_key_delete_error'));
        }
    };

    // Fetch Webhooks
    const fetchWebhooks = async () => {
        try {
            const response = await api.get('/institution-admin/webhooks');
            if (response.data.success) {
                setWebhooks(response.data.webhooks || []);
            }
        } catch (error) {
            console.error('Error fetching webhooks:', error);
        }
    };

    // Handle Create Webhook
    const handleCreateWebhook = async () => {
        setLoading(true);
        try {
            const response = await api.post('/institution-admin/webhooks', newWebhook);
            if (response.data.success) {
                toast.success(t('institution_admin.webhook_created'));
                setIsWebhookModalOpen(false);
                setNewWebhook({ url: '', events: [], secret: '' });
                fetchWebhooks();
            }
        } catch (error) {
            toast.error(translateError(error, t, 'institution_admin.webhook_error'));
        } finally {
            setLoading(false);
        }
    };

    // Handle Delete Webhook
    const handleDeleteWebhook = async (webhookId) => {
        if (!window.confirm(t('institution_admin.delete_webhook_confirm'))) return;
        try {
            const response = await api.delete(`/institution-admin/webhooks/${webhookId}`);
            if (response.data.success) {
                toast.success(t('institution_admin.webhook_deleted'));
                fetchWebhooks();
            }
        } catch (error) {
            toast.error(translateError(error, t, 'institution_admin.webhook_delete_error'));
        }
    };

    return {
        // Users
        users,
        usersLoading,
        usersPage,
        setUsersPage,
        usersPagination,
        searchQuery,
        setSearchQuery,
        userFilter,
        setUserFilter,
        dateRange,
        setDateRange,
        fetchUsers,
        handleRemoveUser,
        handleAddUser,
        handleExport,
        newUser,
        setNewUser,
        
        // Presentations
        presentations,
        presentationsLoading,
        currentPage,
        setCurrentPage,
        pagination,
        presentationStatus,
        setPresentationStatus,
        showMyPresentations,
        setShowMyPresentations,
        fetchPresentations,
        
        // Analytics
        analytics,
        analyticsPeriod,
        setAnalyticsPeriod,
        fetchAnalytics,
        
        // Audit Logs
        auditLogs,
        auditLogsLoading,
        fetchAuditLogs,
        
        // Branding
        branding,
        setBranding,
        handleUpdateBranding,
        fetchBranding,
        
        // Settings
        settings,
        setSettings,
        securitySettings,
        setSecuritySettings,
        handleUpdateSettings,
        handleUpdateSecuritySettings,
        
        // API Management
        apiKeys,
        webhooks,
        fetchApiKeys,
        fetchWebhooks,
        handleCreateApiKey,
        handleDeleteApiKey,
        handleCreateWebhook,
        handleDeleteWebhook,
        newApiKey,
        setNewApiKey,
        newWebhook,
        setNewWebhook,
        
        // Modals
        isAddUserModalOpen,
        setIsAddUserModalOpen,
        isPaymentModalOpen,
        setIsPaymentModalOpen,
        isBulkImportModalOpen,
        setIsBulkImportModalOpen,
        isReportsModalOpen,
        setIsReportsModalOpen,
        isApiKeyModalOpen,
        setIsApiKeyModalOpen,
        isWebhookModalOpen,
        setIsWebhookModalOpen,
        
        // Payment
        pendingEmails,
        setPendingEmails,
        paymentLoading,
        handlePayment,
        userValidation,
        setUserValidation,
        
        // Loading
        loading,
        setLoading,
        
        // Profile
        handleUpdateProfile,
        handleChangePassword
    };
};

