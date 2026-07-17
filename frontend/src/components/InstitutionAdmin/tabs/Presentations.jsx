import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import {
    Presentation,
    Search,
    UserCheck,
    Activity,
    Eye,
    Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getBrandingColors, getRgbaColor } from '../utils/brandingColors';

const Presentations = ({ 
    presentations, 
    presentationsLoading, 
    currentPage, 
    setCurrentPage, 
    pagination, 
    searchQuery, 
    setSearchQuery, 
    presentationStatus, 
    setPresentationStatus, 
    showMyPresentations, 
    setShowMyPresentations, 
    adminUserId, 
    onFetchPresentations,
    institution
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { primaryColor, secondaryColor } = getBrandingColors(institution);

    // Refetch presentations when filters change
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            onFetchPresentations();
        }, searchQuery ? 300 : 0); // Debounce search only if there's a query

        return () => clearTimeout(timeoutId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, presentationStatus, showMyPresentations, currentPage]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">{t('institution_admin.presentations_title')}</h1>
                <p className="text-gray-400">{t('institution_admin.presentations_description')}</p>
            </div>

            {/* Filters */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder={t('institution_admin.search_presentations_placeholder')}
                            className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-white outline-none transition-all text-sm"
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
                    <select
                        value={presentationStatus}
                        onChange={(e) => {
                            setPresentationStatus(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-white outline-none transition-all text-sm"
                        onFocus={(e) => {
                            e.target.style.borderColor = secondaryColor;
                            e.target.style.boxShadow = `0 0 0 2px ${getRgbaColor(secondaryColor, 0.2)}`;
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                            e.target.style.boxShadow = 'none';
                        }}
                    >
                        <option value="all">{t('institution_admin.all') || 'All'}</option>
                        <option value="live">{t('institution_admin.presentation_status_live')}</option>
                        <option value="ended">{t('institution_admin.presentation_status_ended')}</option>
                    </select>
                    <button
                        onClick={() => {
                            if (!adminUserId) {
                                toast.error(t('institution_admin.no_user_account') || 'You need a user account to view your presentations. Please create a presentation first.');
                                return;
                            }
                            setShowMyPresentations(!showMyPresentations);
                            setCurrentPage(1);
                        }}
                        disabled={!adminUserId}
                        className={`px-4 py-2.5 border rounded-lg transition-all text-sm flex items-center gap-2 font-medium ${
                            showMyPresentations
                                ? ''
                                : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                        } ${!adminUserId ? 'opacity-50 cursor-not-allowed' : ''}`}
                        style={showMyPresentations ? {
                            backgroundColor: getRgbaColor(secondaryColor, 0.2),
                            borderColor: getRgbaColor(secondaryColor, 0.3),
                            color: secondaryColor
                        } : {}}
                        title={!adminUserId ? 'Create a presentation first to enable this filter' : ''}
                    >
                        <UserCheck className="w-4 h-4" />
                        {showMyPresentations ? (t('institution_admin.my_presentations') || 'My Presentations') : (t('institution_admin.all_presentations') || 'All Presentations')}
                    </button>
                </div>
            </div>

            {/* Presentations List */}
            {presentationsLoading ? (
                <div className="text-center py-12">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">{t('institution_admin.loading_presentations')}</p>
                </div>
            ) : presentations.length === 0 ? (
                <div className="text-center py-12 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm">
                    <Presentation className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-400">{t('institution_admin.no_presentations_found')}</p>
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        {presentations.map((presentation) => (
                            <div key={presentation.id} className="bg-white/5 border border-white/10 p-6 rounded-xl backdrop-blur-sm hover:bg-white/10 transition-all">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold text-white truncate">{presentation.title}</h3>
                                            {presentation.isLive && (
                                                <span className="px-2.5 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium flex items-center gap-1.5">
                                                    <Activity className="w-3 h-3" />
                                                    Live
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-gray-400 text-sm mb-3">
                                            By: {presentation.createdBy?.displayName || presentation.createdBy?.email || 'Unknown'}
                                        </p>
                                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                            <span className="flex items-center gap-1.5">
                                                <span className="font-medium">Code:</span> {presentation.accessCode}
                                            </span>
                                            <span>{presentation.slideCount || 0} slides</span>
                                            <span>{presentation.responseCount || 0} responses</span>
                                            <span className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5" />
                                                Created: {new Date(presentation.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => navigate(`/presentation/${presentation.id}`)}
                                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-500 text-white text-sm font-medium rounded-lg hover:shadow-lg hover:shadow-teal-500/25 transition-all flex items-center gap-2"
                                            title="View Presentation"
                                        >
                                            <Eye className="w-4 h-4" />
                                            View
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {pagination?.pages > 1 && (
                        <div className="flex items-center justify-center gap-4 mt-8">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                            >
                                {t('institution_admin.previous')}
                            </button>
                            <span className="text-sm text-gray-400 px-4">
                                {t('institution_admin.page_info', { 
                                    current: pagination.page || currentPage, 
                                    total: pagination.pages || 1 
                                })}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(pagination.pages || 1, prev + 1))}
                                disabled={currentPage >= (pagination.pages || 1)}
                                className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
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

export default Presentations;
