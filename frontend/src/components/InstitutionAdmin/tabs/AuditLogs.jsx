import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useMemo } from 'react';
import {
    History,
    Search,
    Filter,
    Download,
    UserPlus,
    UserMinus,
    CreditCard,
    Settings,
    RefreshCw,
    X,
    Clock,
    Globe,
    FileText,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getBrandingColors, getRgbaColor, hexToRgb } from '../utils/brandingColors';

const AuditLogs = ({ auditLogs, auditLogsLoading, dateRange, setDateRange, onFetchAuditLogs, institution }) => {
    const { t } = useTranslation();
    const { primaryColor, secondaryColor } = getBrandingColors(institution);
    const [searchQuery, setSearchQuery] = useState('');
    const [actionFilter, setActionFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Fetch logs on mount and when date range changes
    useEffect(() => {
        onFetchAuditLogs();
        setCurrentPage(1); // Reset to first page when fetching new data
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateRange.start, dateRange.end]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, actionFilter]);

    // Action type options
    const actionTypes = [
        { value: 'all', label: t('institution_admin.filter_all_actions') || 'All Actions' },
        { value: 'user_added', label: t('institution_admin.action_user_added') || 'User Added' },
        { value: 'user_removed', label: t('institution_admin.action_user_removed') || 'User Removed' },
        { value: 'users_added_via_payment', label: t('institution_admin.action_users_added_payment') || 'Users Added via Payment' },
        { value: 'subscription_renewed', label: t('institution_admin.action_subscription_renewed') || 'Subscription Renewed' },
        { value: 'branding_updated', label: t('institution_admin.action_branding_updated') || 'Branding Updated' },
        { value: 'settings_updated', label: t('institution_admin.action_settings_updated') || 'Settings Updated' }
    ];

    // Get icon for action type
    const getActionIcon = (action) => {
        switch (action) {
            case 'user_added':
            case 'users_added_via_payment':
                return <UserPlus className="w-4 h-4" />;
            case 'user_removed':
                return <UserMinus className="w-4 h-4" />;
            case 'subscription_renewed':
                return <CreditCard className="w-4 h-4" />;
            case 'branding_updated':
                return <Settings className="w-4 h-4" />;
            case 'settings_updated':
                return <Settings className="w-4 h-4" />;
            default:
                return <FileText className="w-4 h-4" />;
        }
    };

    // Get color for action type
    const getActionColor = (action) => {
        switch (action) {
            case 'user_added':
            case 'users_added_via_payment':
                return 'text-green-400 bg-green-500/10 border-green-500/30';
            case 'user_removed':
                return 'text-red-400 bg-red-500/10 border-red-500/30';
            case 'subscription_renewed':
                return '';
            case 'branding_updated':
            case 'settings_updated':
                return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
            default:
                return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
        }
    };
    
    const getActionStyle = (action) => {
        if (action === 'subscription_renewed') {
            return {
                color: primaryColor,
                backgroundColor: getRgbaColor(primaryColor, 0.1),
                borderColor: getRgbaColor(primaryColor, 0.3)
            };
        }
        return {};
    };

    // Format action label
    const formatActionLabel = (action) => {
        const actionMap = {
            'user_added': t('institution_admin.action_user_added') || 'User Added',
            'user_removed': t('institution_admin.action_user_removed') || 'User Removed',
            'users_added_via_payment': t('institution_admin.action_users_added_payment') || 'Users Added via Payment',
            'subscription_renewed': t('institution_admin.action_subscription_renewed') || 'Subscription Renewed',
            'branding_updated': t('institution_admin.action_branding_updated') || 'Branding Updated',
            'settings_updated': t('institution_admin.action_settings_updated') || 'Settings Updated'
        };
        return actionMap[action] || action;
    };

    // Filter logs based on search query and action filter
    const filteredLogs = useMemo(() => {
        return auditLogs.filter(log => {
            // Action filter
            if (actionFilter !== 'all' && log.action !== actionFilter) {
                return false;
            }

            // Search filter
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const matchesSearch = 
                    log.user?.toLowerCase().includes(query) ||
                    log.details?.toLowerCase().includes(query) ||
                    log.action?.toLowerCase().includes(query) ||
                    log.ipAddress?.toLowerCase().includes(query);
                
                if (!matchesSearch) {
                    return false;
                }
            }

            return true;
        });
    }, [auditLogs, searchQuery, actionFilter]);

    // Calculate pagination
    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Format relative time
    const formatRelativeTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return t('institution_admin.just_now') || 'Just now';
        if (diffMins < 60) return `${diffMins} ${t('institution_admin.minutes_ago') || 'minutes ago'}`;
        if (diffHours < 24) return `${diffHours} ${t('institution_admin.hours_ago') || 'hours ago'}`;
        if (diffDays < 7) return `${diffDays} ${t('institution_admin.days_ago') || 'days ago'}`;
        return formatDate(dateString);
    };

    // Handle export
    const handleExport = () => {
        try {
            const exportData = filteredLogs.map(log => ({
                timestamp: log.timestamp,
                action: formatActionLabel(log.action),
                user: log.user,
                details: log.details,
                ipAddress: log.ipAddress
            }));

            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success(t('institution_admin.audit_logs_exported') || 'Audit logs exported successfully');
        } catch (error) {
            console.error('Export error:', error);
            toast.error(t('institution_admin.export_error') || 'Failed to export audit logs');
        }
    };

    // Clear filters
    const clearFilters = () => {
        setSearchQuery('');
        setActionFilter('all');
        setDateRange({ start: '', end: '' });
    };

    const hasActiveFilters = searchQuery || actionFilter !== 'all' || dateRange.start || dateRange.end;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8"
        >
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-white mb-2">
                    {t('institution_admin.audit_logs_title')}
                </h1>
                <p className="text-gray-400">
                    {t('institution_admin.audit_logs_description')}
                </p>
            </div>

            {/* Filters and Actions */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm mb-6">
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-4">
                    {/* Search */}
                    <div className="flex-1 w-full lg:w-auto">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                placeholder={t('institution_admin.search_audit_logs') || 'Search by user, action, details, or IP...'}
                                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                                showFilters || hasActiveFilters
                                    ? ''
                                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                            }`}
                            style={(showFilters || hasActiveFilters) ? {
                                backgroundColor: getRgbaColor(secondaryColor, 0.2),
                                borderColor: getRgbaColor(secondaryColor, 0.3),
                                color: secondaryColor
                            } : {}}
                        >
                            <Filter className="w-4 h-4" />
                            {t('institution_admin.filters') || 'Filters'}
                            {hasActiveFilters && (
                                <span className="ml-1 px-1.5 py-0.5 text-white text-xs rounded-full" style={{ backgroundColor: secondaryColor }}>
                                    {[searchQuery, actionFilter !== 'all' ? 1 : 0, dateRange.start ? 1 : 0, dateRange.end ? 1 : 0].filter(Boolean).length}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={onFetchAuditLogs}
                            disabled={auditLogsLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <RefreshCw className={`w-4 h-4 ${auditLogsLoading ? 'animate-spin' : ''}`} />
                            {t('institution_admin.refresh') || 'Refresh'}
                        </button>

                        <button
                            onClick={handleExport}
                            disabled={filteredLogs.length === 0}
                            className="flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                backgroundColor: getRgbaColor(secondaryColor, 0.2),
                                borderColor: getRgbaColor(secondaryColor, 0.3),
                                color: secondaryColor
                            }}
                            onMouseEnter={(e) => {
                                if (!e.target.disabled) {
                                    e.target.style.backgroundColor = getRgbaColor(secondaryColor, 0.3);
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = getRgbaColor(secondaryColor, 0.2);
                            }}
                        >
                            <Download className="w-4 h-4" />
                            {t('institution_admin.export') || 'Export'}
                        </button>
                    </div>
                </div>

                {/* Advanced Filters */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Action Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        {t('institution_admin.audit_action')}
                                    </label>
                                    <select
                                        value={actionFilter}
                                        onChange={(e) => {
                                            setActionFilter(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    >
                                        {actionTypes.map(type => (
                                            <option key={type.value} value={type.value} className="bg-[#0f172a]">
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Start Date */}
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        {t('institution_admin.filter_from_date')}
                                    </label>
                                    <input
                                        type="date"
                                        value={dateRange.start}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    />
                                </div>

                                {/* End Date */}
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        {t('institution_admin.filter_to_date')}
                                    </label>
                                    <input
                                        type="date"
                                        value={dateRange.end}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    />
                                </div>
                            </div>

                            {hasActiveFilters && (
                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={clearFilters}
                                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                        {t('institution_admin.clear_filters') || 'Clear Filters'}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Audit Logs List */}
            <div className="bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm overflow-hidden">
                {auditLogsLoading ? (
                    <div className="p-12 text-center">
                        <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin" style={{ color: secondaryColor }} />
                        <p className="text-gray-400">{t('institution_admin.loading_audit_logs')}</p>
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="p-12 text-center">
                        <History className="w-16 h-16 mx-auto mb-4 text-gray-500 opacity-50" />
                        <p className="text-gray-400 text-lg mb-2">
                            {hasActiveFilters 
                                ? (t('institution_admin.no_audit_logs_filtered') || 'No audit logs match your filters')
                                : (t('institution_admin.no_audit_logs') || 'No audit logs found')
                            }
                        </p>
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="mt-4 transition-colors"
                                style={{ color: secondaryColor }}
                                onMouseEnter={(e) => {
                                    const rgb = hexToRgb(secondaryColor);
                                    if (rgb) {
                                        e.target.style.color = `rgb(${Math.max(0, rgb.r - 30)}, ${Math.max(0, rgb.g - 30)}, ${Math.max(0, rgb.b - 30)})`;
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.color = secondaryColor;
                                }}
                            >
                                {t('institution_admin.clear_filters') || 'Clear Filters'}
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="divide-y divide-white/10">
                            {paginatedLogs.map((log, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.02 }}
                                className="p-6 hover:bg-white/5 transition-colors"
                            >
                                <div className="flex items-start gap-4">
                                    {/* Action Icon */}
                                    <div 
                                        className={`flex items-center justify-center w-10 h-10 rounded-lg border flex-shrink-0 ${getActionColor(log.action)}`}
                                        style={getActionStyle(log.action)}
                                    >
                                        {getActionIcon(log.action)}
                                    </div>

                                    {/* Log Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4 mb-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-semibold text-white">
                                                        {formatActionLabel(log.action)}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {formatRelativeTime(log.timestamp)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-300 mb-2">
                                                    {log.details}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Metadata */}
                                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span>{formatDate(log.timestamp)}</span>
                                            </div>
                                            {log.user && (
                                                <div className="flex items-center gap-1.5">
                                                    <UserPlus className="w-3.5 h-3.5" />
                                                    <span>{log.user}</span>
                                                </div>
                                            )}
                                            {log.ipAddress && log.ipAddress !== 'unknown' && (
                                                <div className="flex items-center gap-1.5">
                                                    <Globe className="w-3.5 h-3.5" />
                                                    <span>{log.ipAddress}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="px-6 py-4 bg-white/5 border-t border-white/10">
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                    {/* Results Count */}
                                    <p className="text-sm text-gray-400">
                                        {filteredLogs.length === auditLogs.length
                                            ? `${startIndex + 1}-${Math.min(endIndex, filteredLogs.length)} of ${filteredLogs.length} ${t('institution_admin.logs_shown') || 'logs shown'}`
                                            : `${startIndex + 1}-${Math.min(endIndex, filteredLogs.length)} of ${filteredLogs.length} ${t('institution_admin.logs_shown') || 'logs shown'} (${auditLogs.length} total)`
                                        }
                                    </p>

                                    {/* Pagination Controls */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                            className="flex items-center gap-1 px-3 py-2 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                            {t('institution_admin.previous') || 'Previous'}
                                        </button>
                                        
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                let pageNum;
                                                if (totalPages <= 5) {
                                                    pageNum = i + 1;
                                                } else if (currentPage <= 3) {
                                                    pageNum = i + 1;
                                                } else if (currentPage >= totalPages - 2) {
                                                    pageNum = totalPages - 4 + i;
                                                } else {
                                                    pageNum = currentPage - 2 + i;
                                                }
                                                
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => setCurrentPage(pageNum)}
                                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                            currentPage === pageNum
                                                                ? 'bg-teal-500 text-white'
                                                                : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                                                        }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <span className="text-sm text-gray-400 px-2">
                                            {t('institution_admin.page_info', { 
                                                current: currentPage, 
                                                total: totalPages 
                                            }) || `Page ${currentPage} of ${totalPages}`}
                                        </span>

                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage >= totalPages}
                                            className="flex items-center gap-1 px-3 py-2 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                                        >
                                            {t('institution_admin.next') || 'Next'}
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Results Count (when no pagination) */}
                        {totalPages <= 1 && filteredLogs.length > 0 && (
                            <div className="px-6 py-4 bg-white/5 border-t border-white/10">
                                <p className="text-sm text-gray-400">
                                    {filteredLogs.length === auditLogs.length
                                        ? `${filteredLogs.length} ${t('institution_admin.logs_shown') || 'logs shown'}`
                                        : `${filteredLogs.length} of ${auditLogs.length} ${t('institution_admin.logs_shown') || 'logs shown'}`
                                    }
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </motion.div>
    );
};

export default AuditLogs;
