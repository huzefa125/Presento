import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import {
    Users as UsersIcon,
    Plus,
    Upload,
    Search,
    Filter,
    Calendar,
    Presentation,
    FileText,
    Trash2,
    UserCheck
} from 'lucide-react';
import { getBrandingColors, getRgbaColor } from '../utils/brandingColors';

const Users = ({ 
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
    onAddUser, 
    onBulkImport, 
    onRemoveUser, 
    onFetchUsers,
    institution
}) => {
    const { t } = useTranslation();
    const { primaryColor, secondaryColor } = getBrandingColors(institution);

    // Refetch users when filters change
    useEffect(() => {
        if (dateRange.end) {
            onFetchUsers();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateRange.end, userFilter.status]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">{t('institution_admin.user_management')}</h1>
                    <p className="text-gray-400">{t('institution_admin.manage_institution_users')}</p>
                </div>
                <div className="flex gap-3 flex-wrap">
                    <button
                        onClick={onBulkImport}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white/10 border border-white/20 text-white text-sm font-medium rounded-lg hover:bg-white/20 transition-colors"
                    >
                        <Upload className="w-4 h-4" />
                        {t('institution_admin.bulk_import')}
                    </button>
                    <button
                        onClick={onAddUser}
                        className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all"
                        style={{
                            background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
                            boxShadow: `0 10px 15px -3px ${getRgbaColor(secondaryColor, 0.25)}`
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.boxShadow = `0 10px 15px -3px ${getRgbaColor(secondaryColor, 0.4)}`;
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.boxShadow = `0 10px 15px -3px ${getRgbaColor(secondaryColor, 0.25)}`;
                        }}
                    >
                        <Plus className="w-4 h-4" />
                        {t('institution_admin.add_user')}
                    </button>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 backdrop-blur-sm">
                <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                        <Search className="w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setUsersPage(1);
                            }}
                            placeholder={t('institution_admin.search_users_placeholder')}
                            className="flex-1 px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white outline-none text-sm"
                            style={{
                                '--tw-ring-color': secondaryColor
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = secondaryColor;
                                e.target.style.boxShadow = `0 0 0 2px ${getRgbaColor(secondaryColor, 0.2)}`;
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-gray-400" />
                        <select
                            value={userFilter.status}
                            onChange={(e) => setUserFilter({ ...userFilter, status: e.target.value })}
                            className="px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm outline-none"
                            onFocus={(e) => {
                                e.target.style.borderColor = secondaryColor;
                                e.target.style.boxShadow = `0 0 0 2px ${getRgbaColor(secondaryColor, 0.2)}`;
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                e.target.style.boxShadow = 'none';
                            }}
                        >
                            <option value="all">{t('institution_admin.filter_all_status')}</option>
                            <option value="active">{t('institution_admin.filter_active')}</option>
                            <option value="inactive">{t('institution_admin.filter_inactive')}</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            className="px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                        />
                        <span className="text-gray-400">-</span>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => {
                                setDateRange({ ...dateRange, end: e.target.value });
                                onFetchUsers();
                            }}
                            className="px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Users List */}
            {usersLoading ? (
                <div className="text-center py-12">
                    <div 
                        className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
                        style={{ borderColor: `${primaryColor} transparent transparent transparent` }}
                    ></div>
                    <p className="text-gray-400">{t('institution_admin.loading_users')}</p>
                </div>
            ) : users.length === 0 ? (
                <div className="text-center py-12 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm">
                    <UsersIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-400">{t('institution_admin.no_users_found')}</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {users.map((user) => (
                            <div key={user.id} className="bg-white/5 border border-white/10 p-6 rounded-xl backdrop-blur-sm hover:bg-white/10 transition-all flex flex-col">
                                <div className="flex flex-col gap-3 sm:gap-4 flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                                            {user.photoURL ? (
                                                <img 
                                                    src={user.photoURL} 
                                                    alt={user.displayName} 
                                                    className="w-12 h-12 rounded-full flex-shrink-0 border-2 border-white/20" 
                                                />
                                            ) : (
                                                <div 
                                                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0"
                                                    style={{
                                                        background: `linear-gradient(to bottom right, ${primaryColor}, ${secondaryColor})`
                                                    }}
                                                >
                                                    {user.displayName?.charAt(0)?.toUpperCase() || 'U'}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="text-base font-semibold text-white truncate">
                                                        {user.displayName || user.email}
                                                    </h3>
                                                    {user.isInstitutionUser && (
                                                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs font-medium whitespace-nowrap">
                                                            <UserCheck className="w-3 h-3 inline mr-1" />
                                                            Active
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-gray-400 text-sm truncate mt-1">{user.email}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => onRemoveUser(user.id)}
                                            className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors flex-shrink-0"
                                            title={t('institution_admin.remove_user') || 'Remove user'}
                                        >
                                            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </button>
                                    </div>
                                    <div className="flex flex-col gap-3 mt-auto pt-4 border-t border-white/10">
                                        <div className="flex flex-wrap gap-4">
                                            <span className="text-xs text-gray-400 flex items-center gap-1.5">
                                                <Presentation className="w-3.5 h-3.5" />
                                                {user.presentationCount || 0} {t('institution_admin.presentations_count')}
                                            </span>
                                            <span className="text-xs text-gray-400 flex items-center gap-1.5">
                                                <FileText className="w-3.5 h-3.5" />
                                                {user.slideCount || 0} {t('institution_admin.slides_count')}
                                            </span>
                                        </div>
                                        {user.createdAt && (
                                            <span className="text-xs text-gray-500 flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {t('institution_admin.joined')} {new Date(user.createdAt).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination - Show when there are more than 15 users */}
                    {usersPagination?.pages > 1 && (
                        <div className="flex items-center justify-center gap-4 mt-8">
                            <button
                                onClick={() => setUsersPage(prev => Math.max(1, prev - 1))}
                                disabled={usersPage === 1}
                                className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                            >
                                {t('institution_admin.previous')}
                            </button>
                            <span className="text-sm text-gray-400 px-4">
                                {t('institution_admin.page_info', { 
                                    current: usersPagination.page || usersPage, 
                                    total: usersPagination.pages || 1
                                })}
                                {usersPagination.total && (
                                    <span className="text-xs text-gray-500 ml-2">
                                        ({usersPagination.total} {t('institution_admin.total_users')})
                                    </span>
                                )}
                            </span>
                            <button
                                onClick={() => setUsersPage(prev => Math.min(usersPagination.pages || 1, prev + 1))}
                                disabled={usersPage >= (usersPagination.pages || 1)}
                                className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                            >
                                {t('institution_admin.next')}
                            </button>
                        </div>
                    )}
                </>
            )}
        </motion.div>
    );
};

export default Users;
