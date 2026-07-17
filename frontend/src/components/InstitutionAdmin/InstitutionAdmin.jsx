import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useInstitutionAdmin } from './hooks/useInstitutionAdmin';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import {
    Dashboard,
    Users,
    Presentations,
    Analytics,
    Subscription,
    Branding,
    AuditLogs,
    Settings,
    HelpCenter
} from './tabs';
import AddUserModal from './components/modals/AddUserModal';
import PaymentModal from './components/modals/PaymentModal';
import BulkImportModal from './components/modals/BulkImportModal';
import ReportsModal from './components/modals/ReportsModal';
import ProfileModal from './components/modals/ProfileModal';
import { useInstitutionAdminData } from './hooks/useInstitutionAdminData';
import api from '../../config/api';

const InstitutionAdmin = () => {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const tabFromUrl = searchParams.get('tab') || 'dashboard';
    const [activeTab, setActiveTab] = useState(tabFromUrl);

    // Update URL when tab changes
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setSearchParams({ tab });
    };

    // Sync with URL on mount (when component first loads or URL changes externally)
    useEffect(() => {
        const urlTab = searchParams.get('tab') || 'dashboard';
        if (urlTab !== activeTab) {
            setActiveTab(urlTab);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);
    
    const {
        isAuthenticated,
        institution,
        stats,
        loading,
        adminUserId,
        fetchStats,
        handleLogout,
        refreshInstitution
    } = useInstitutionAdmin();

    const {
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
        
        // Modals
        isAddUserModalOpen,
        setIsAddUserModalOpen,
        isPaymentModalOpen,
        setIsPaymentModalOpen,
        isBulkImportModalOpen,
        setIsBulkImportModalOpen,
        isReportsModalOpen,
        setIsReportsModalOpen,
        
        // Payment
        pendingEmails,
        paymentLoading,
        handlePayment,
        userValidation,
        setUserValidation,
        
        // Profile
        handleUpdateProfile,
        handleChangePassword
    } = useInstitutionAdminData({
        adminUserId,
        fetchStats
    });

    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    // Hide body scrollbar when component is mounted
    useEffect(() => {
        document.body.style.overflow = 'auto';
        document.body.classList.add('scrollbar-hide');
        return () => {
            document.body.classList.remove('scrollbar-hide');
        };
    }, []);

    // Apply branding colors as CSS variables
    useEffect(() => {
        if (institution?.branding) {
            const primaryColor = institution.branding.primaryColor || '#3b82f6';
            const secondaryColor = institution.branding.secondaryColor || '#14b8a6';
            
            // Set CSS variables on the root element
            document.documentElement.style.setProperty('--institution-primary-color', primaryColor);
            document.documentElement.style.setProperty('--institution-secondary-color', secondaryColor);
            
            // Also set on the main container for scoped usage
            const mainContainer = document.querySelector('.institution-admin-container');
            if (mainContainer) {
                mainContainer.style.setProperty('--primary-color', primaryColor);
                mainContainer.style.setProperty('--secondary-color', secondaryColor);
            }
        }
    }, [institution?.branding]);

    // Update page title based on active tab
    useEffect(() => {
        const tabTitles = {
            dashboard: t('institution_admin.dashboard_overview'),
            users: t('institution_admin.user_management'),
            presentations: t('institution_admin.presentations_title'),
            analytics: t('institution_admin.analytics_title'),
            subscription: t('institution_admin.subscription_billing'),
            branding: t('institution_admin.custom_branding'),
            audit: t('institution_admin.audit_logs'),
            settings: t('institution_admin.settings_title'),
            help: t('institution_admin.help_center')
        };
        
        const tabTitle = tabTitles[activeTab] || t('page_titles.institution_admin');
        document.title = `${tabTitle} - Inavora`;
        
        return () => {
            document.title = t('page_titles.institution_admin');
        };
    }, [activeTab, t]);

    // Fetch data when tab changes
    useEffect(() => {
        if (!isAuthenticated) return;
        
        if (activeTab === 'dashboard') {
            fetchStats();
        } else if (activeTab === 'users') {
            fetchUsers();
        } else if (activeTab === 'presentations') {
            fetchPresentations();
        } else if (activeTab === 'analytics') {
            fetchAnalytics();
        } else if (activeTab === 'audit') {
            fetchAuditLogs();
        } else if (activeTab === 'branding') {
            fetchBranding();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, isAuthenticated, currentPage, usersPage, searchQuery, presentationStatus, analyticsPeriod]);

    // Show loading or redirect if not authenticated
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#0f172a] text-white overflow-x-hidden font-sans flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">{t('institution_admin.redirecting_to_login')}</p>
                </div>
            </div>
        );
    }

    // Get branding colors with fallbacks
    const primaryColor = institution?.branding?.primaryColor || '#3b82f6';
    const secondaryColor = institution?.branding?.secondaryColor || '#14b8a6';
    
    // Convert hex to RGB for opacity usage
    const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    };
    
    const primaryRgb = hexToRgb(primaryColor);
    const secondaryRgb = hexToRgb(secondaryColor);
    const primaryBg = primaryRgb ? `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.2)` : 'rgba(59, 130, 246, 0.2)';
    const secondaryBg = secondaryRgb ? `rgba(${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}, 0.1)` : 'rgba(20, 184, 166, 0.1)';

    return (
        <div className="min-h-screen bg-[#0f172a] text-white overflow-x-hidden font-sans scrollbar-hide institution-admin-container">
            {/* Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div 
                    className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] animate-pulse" 
                    style={{ backgroundColor: primaryBg }}
                />
                <div 
                    className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] animate-pulse delay-1000" 
                    style={{ backgroundColor: secondaryBg }}
                />
            </div>

            {/* Top Navigation Bar */}
            <TopNav 
                institution={institution} 
                onLogout={handleLogout}
                onOpenProfile={() => setIsProfileModalOpen(true)}
            />

            <div className="flex pt-16 relative z-10">
                {/* Sidebar Navigation */}
                <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} institution={institution} />

                {/* Main Content */}
                <main className="flex-1 ml-64 p-8 relative z-10">
                    {activeTab === 'dashboard' && (
                        <Dashboard
                            stats={stats}
                            institution={institution}
                            onAddUser={() => setIsAddUserModalOpen(true)}
                            onExport={handleExport}
                            onSetActiveTab={setActiveTab}
                            onOpenReportsModal={() => setIsReportsModalOpen(true)}
                            onOpenCustomReportModal={() => {}}
                        />
                    )}

                    {activeTab === 'users' && (
                        <Users
                            users={users}
                            usersLoading={usersLoading}
                            usersPage={usersPage}
                            setUsersPage={setUsersPage}
                            usersPagination={usersPagination}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            userFilter={userFilter}
                            setUserFilter={setUserFilter}
                            dateRange={dateRange}
                            setDateRange={setDateRange}
                            onAddUser={() => setIsAddUserModalOpen(true)}
                            onBulkImport={() => setIsBulkImportModalOpen(true)}
                            onRemoveUser={handleRemoveUser}
                            onFetchUsers={fetchUsers}
                            institution={institution}
                        />
                    )}

                    {activeTab === 'presentations' && (
                        <Presentations
                            presentations={presentations}
                            presentationsLoading={presentationsLoading}
                            currentPage={currentPage}
                            setCurrentPage={setCurrentPage}
                            pagination={pagination}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            presentationStatus={presentationStatus}
                            setPresentationStatus={setPresentationStatus}
                            showMyPresentations={showMyPresentations}
                            setShowMyPresentations={setShowMyPresentations}
                            adminUserId={adminUserId}
                            onFetchPresentations={fetchPresentations}
                            institution={institution}
                        />
                    )}

                    {activeTab === 'analytics' && (
                        <Analytics
                            analytics={analytics}
                            analyticsPeriod={analyticsPeriod}
                            setAnalyticsPeriod={setAnalyticsPeriod}
                            onFetchAnalytics={fetchAnalytics}
                            institution={institution}
                        />
                    )}

                    {activeTab === 'subscription' && (
                        <Subscription
                            institution={institution}
                            stats={stats}
                            onRefresh={fetchStats}
                            onAddUser={() => setIsAddUserModalOpen(true)}
                        />
                    )}

                    {activeTab === 'branding' && (
                        <Branding
                            branding={branding}
                            setBranding={setBranding}
                            loading={loading}
                            onUpdateBranding={async (e) => {
                                const success = await handleUpdateBranding(e);
                                if (success && refreshInstitution) {
                                    // Refresh institution data to get updated branding
                                    await refreshInstitution();
                                }
                            }}
                            institution={institution}
                        />
                    )}

                    {activeTab === 'audit' && (
                        <AuditLogs
                            auditLogs={auditLogs}
                            auditLogsLoading={auditLogsLoading}
                            dateRange={dateRange}
                            setDateRange={setDateRange}
                            onFetchAuditLogs={fetchAuditLogs}
                            institution={institution}
                        />
                    )}

                    {activeTab === 'settings' && (
                        <Settings
                            settings={settings}
                            setSettings={setSettings}
                            securitySettings={securitySettings}
                            setSecuritySettings={setSecuritySettings}
                            loading={loading}
                            onUpdateSettings={async (e) => {
                                await handleUpdateSettings(e);
                                if (refreshInstitution) {
                                    await refreshInstitution();
                                }
                            }}
                            onUpdateSecuritySettings={async (e) => {
                                await handleUpdateSecuritySettings(e);
                                if (refreshInstitution) {
                                    await refreshInstitution();
                                }
                            }}
                            institution={institution}
                        />
                    )}

                    {activeTab === 'help' && (
                        <HelpCenter institution={institution} />
                    )}
                </main>
            </div>

            {/* Modals */}
            <AddUserModal
                isOpen={isAddUserModalOpen}
                onClose={() => setIsAddUserModalOpen(false)}
                onAddUser={handleAddUser}
                loading={loading}
                newUser={newUser}
                setNewUser={setNewUser}
            />

            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => {
                    setIsPaymentModalOpen(false);
                    setUserValidation(null);
                }}
                pendingEmails={pendingEmails}
                paymentLoading={paymentLoading}
                userValidation={userValidation}
                institution={institution}
                onPayment={handlePayment}
            />

            <BulkImportModal
                isOpen={isBulkImportModalOpen}
                onClose={() => setIsBulkImportModalOpen(false)}
                onImport={() => {}}
            />

            <ReportsModal
                isOpen={isReportsModalOpen}
                onClose={() => setIsReportsModalOpen(false)}
                onGenerate={() => {}}
                loading={loading}
            />

            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                institution={institution}
                onUpdateProfile={async (profileData) => {
                    const updated = await handleUpdateProfile(profileData);
                    if (updated?.institution) {
                        // Refresh institution data
                        window.location.reload(); // Simple refresh for now
                    }
                }}
                onChangePassword={handleChangePassword}
                loading={loading}
            />
        </div>
    );
};

export default InstitutionAdmin;

