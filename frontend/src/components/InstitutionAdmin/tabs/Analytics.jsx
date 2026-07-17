import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import {
    TrendingUp,
    Presentation,
    BarChart3
} from 'lucide-react';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { getBrandingColors, getRgbaColor } from '../utils/brandingColors';

const Analytics = ({
    analytics,
    analyticsPeriod,
    setAnalyticsPeriod,
    onFetchAnalytics,
    institution
}) => {
    const { t } = useTranslation();
    const { primaryColor, secondaryColor } = getBrandingColors(institution);

    useEffect(() => {
        onFetchAnalytics();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [analyticsPeriod]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            {/* Period Selector */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-ink mb-2">{t('institution_admin.analytics_title')}</h1>
                    <p className="text-ink-muted">{t('institution_admin.analytics_description')}</p>
                </div>
                <select
                    value={analyticsPeriod}
                    onChange={(e) => {
                        setAnalyticsPeriod(e.target.value);
                    }}
                    className="px-4 py-2.5 bg-surface border border-hairline rounded-xs text-ink outline-none text-sm font-medium"
                    onFocus={(e) => {
                        e.target.style.borderColor = secondaryColor;
                        e.target.style.boxShadow = `0 0 0 2px ${getRgbaColor(secondaryColor, 0.2)}`;
                    }}
                    onBlur={(e) => {
                        e.target.style.borderColor = '#e6e6e6';
                        e.target.style.boxShadow = 'none';
                    }}
                >
                    <option value="7">{t('institution_admin.period_7_days')}</option>
                    <option value="30">{t('institution_admin.period_30_days')}</option>
                    <option value="90">{t('institution_admin.period_90_days')}</option>
                    <option value="365">{t('institution_admin.period_365_days')}</option>
                </select>
            </div>

            {analytics ? (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="bg-surface border border-hairline p-6 rounded-lg shadow-[var(--shadow-level-1)]">
                            <p className="text-ink-muted text-sm mb-2">{t('institution_admin.total_presentations')}</p>
                            <p className="text-3xl font-bold text-ink">{analytics.totalPresentations || 0}</p>
                            <p className="text-xs text-ink-faint mt-1">{t('institution_admin.last_days', { days: analytics.period || analyticsPeriod })}</p>
                        </div>
                        <div className="bg-surface border border-hairline p-6 rounded-lg shadow-[var(--shadow-level-1)]">
                            <p className="text-ink-muted text-sm mb-2">{t('institution_admin.total_responses_label')}</p>
                            <p className="text-3xl font-bold text-ink">{analytics.totalResponses || 0}</p>
                            <p className="text-xs text-ink-faint mt-1">{t('institution_admin.last_days', { days: analytics.period || analyticsPeriod })}</p>
                        </div>
                        <div className="bg-surface border border-hairline p-6 rounded-lg shadow-[var(--shadow-level-1)]">
                            <p className="text-ink-muted text-sm mb-2">{t('institution_admin.top_presentations')}</p>
                            <p className="text-3xl font-bold text-ink">{analytics.topPresentations?.length || 0}</p>
                            <p className="text-xs text-ink-faint mt-1">{t('institution_admin.by_engagement')}</p>
                        </div>
                    </div>

                    {/* Charts */}
                    {analytics.presentationStats && analytics.responseStats &&
                    (Object.keys(analytics.presentationStats).length > 0 || Object.keys(analytics.responseStats).length > 0) ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Presentations Over Time */}
                            <div className="bg-surface border border-hairline rounded-lg p-6 shadow-[var(--shadow-level-1)]">
                                <h3 className="text-lg font-semibold text-ink mb-4">{t('institution_admin.presentations_over_time')}</h3>
                                {Object.keys(analytics.presentationStats).length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <AreaChart data={Object.entries(analytics.presentationStats || {}).map(([date, count]) => ({
                                            date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                                            count
                                        }))}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e6e6e6" />
                                            <XAxis dataKey="date" stroke="#a39e98" fontSize={12} />
                                            <YAxis stroke="#a39e98" fontSize={12} />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#ffffff',
                                                    border: '1px solid #e6e6e6',
                                                    borderRadius: '8px',
                                                    color: '#000000'
                                                }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="count"
                                                stroke="#62aef0"
                                                fill="#62aef0"
                                                fillOpacity={0.3}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-[300px] text-ink-muted">
                                        <p>{t('institution_admin.no_presentation_data')}</p>
                                    </div>
                                )}
                            </div>

                            {/* Responses Over Time */}
                            <div className="bg-surface border border-hairline rounded-lg p-6 shadow-[var(--shadow-level-1)]">
                                <h3 className="text-lg font-semibold text-ink mb-4">{t('institution_admin.responses_over_time')}</h3>
                                {Object.keys(analytics.responseStats).length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <AreaChart data={Object.entries(analytics.responseStats || {}).map(([date, count]) => ({
                                            date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                                            count
                                        }))}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e6e6e6" />
                                            <XAxis dataKey="date" stroke="#a39e98" fontSize={12} />
                                            <YAxis stroke="#a39e98" fontSize={12} />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#ffffff',
                                                    border: '1px solid #e6e6e6',
                                                    borderRadius: '8px',
                                                    color: '#000000'
                                                }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="count"
                                                stroke="#2a9d99"
                                                fill="#2a9d99"
                                                fillOpacity={0.3}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-[300px] text-ink-muted">
                                        <p>{t('institution_admin.no_response_data')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-surface border border-hairline rounded-lg p-8 text-center shadow-[var(--shadow-level-1)]">
                            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-ink-faint" />
                            <p className="text-ink-muted">{t('institution_admin.no_chart_data')}</p>
                        </div>
                    )}

                    {/* Top Presentations Bar Chart */}
                    {analytics.topPresentations && analytics.topPresentations.length > 0 ? (
                        <div className="bg-surface border border-hairline rounded-lg p-4 sm:p-6 shadow-[var(--shadow-level-1)]">
                            <h3 className="text-lg font-bold text-ink mb-4">{t('institution_admin.top_presentations_by_responses')}</h3>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={analytics.topPresentations.slice(0, 10).map(p => ({
                                    name: p.title && p.title.length > 20 ? p.title.substring(0, 20) + '...' : (p.title || 'Untitled'),
                                    responses: p.responseCount || 0
                                }))} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e6e6e6" />
                                    <XAxis type="number" stroke="#a39e98" fontSize={12} />
                                    <YAxis dataKey="name" type="category" stroke="#a39e98" fontSize={12} width={150} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#ffffff',
                                            border: '1px solid #e6e6e6',
                                            borderRadius: '8px',
                                            color: '#000000'
                                        }}
                                    />
                                    <Bar dataKey="responses" fill="#d6b6f6" radius={[0, 8, 8, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="bg-surface border border-hairline rounded-lg p-8 text-center shadow-[var(--shadow-level-1)]">
                            <Presentation className="w-12 h-12 mx-auto mb-4 text-ink-faint" />
                            <p className="text-ink-muted">{t('institution_admin.no_top_presentations_data')}</p>
                        </div>
                    )}

                </div>
            ) : (
                <div className="text-center py-12 bg-surface border border-hairline rounded-lg shadow-[var(--shadow-level-1)]">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-ink-muted">{t('institution_admin.loading_analytics')}</p>
                </div>
            )}
        </motion.div>
    );
};

export default Analytics;
