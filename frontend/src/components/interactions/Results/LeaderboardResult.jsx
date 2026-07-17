import { motion } from 'framer-motion';
import ResultCard from './ResultCard';
import { Medal } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LeaderboardResult = ({ slide, data }) => {
    const { t } = useTranslation();
    const leaderboard = data?.leaderboard || [];

    return (
        <ResultCard slide={slide} totalResponses={leaderboard.length}>
            <div className="space-y-4 max-w-3xl mx-auto">
                {leaderboard.length === 0 ? (
                    <div className="text-center py-12 text-ink-faint italic">
                        {t('slide_editors.leaderboard.no_participants_yet')}
                    </div>
                ) : (
                    leaderboard.map((participant, index) => {
                        let rankColor = 'text-ink-muted';
                        let bgColor = 'bg-canvas-soft';
                        let borderColor = 'border-hairline';
                        let iconColor = 'text-ink-faint';

                        if (index === 0) {
                            rankColor = 'text-accent-green';
                            bgColor = 'bg-accent-green/10';
                            borderColor = 'border-accent-green/30';
                            iconColor = 'text-accent-green';
                        } else if (index === 1) {
                            rankColor = 'text-accent-sky';
                            bgColor = 'bg-accent-sky/10';
                            borderColor = 'border-accent-sky/30';
                            iconColor = 'text-accent-sky';
                        } else if (index === 2) {
                            rankColor = 'text-accent-orange';
                            bgColor = 'bg-accent-orange/10';
                            borderColor = 'border-accent-orange/30';
                            iconColor = 'text-accent-orange';
                        }

                        return (
                            <motion.div
                                key={participant.participantId || index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className={`flex items-center p-4 rounded-xl border ${borderColor} ${bgColor} relative overflow-hidden`}
                            >
                                {/* Rank Icon/Number */}
                                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center mr-6">
                                    {index < 3 ? (
                                        <Medal className={`w-8 h-8 ${iconColor}`} />
                                    ) : (
                                        <span className="text-xl font-bold text-ink-faint">#{index + 1}</span>
                                    )}
                                </div>

                                {/* Name */}
                                <div className="flex-1">
                                    <h4 className={`text-xl font-bold ${index === 0 ? 'text-ink' : 'text-ink-secondary'}`}>
                                        {participant.participantName || t('slide_editors.leaderboard.anonymous')}
                                    </h4>
                                    {participant.quizCount !== undefined && (
                                        <p className="text-xs text-ink-faint mt-1">{participant.quizCount} {t('slide_editors.leaderboard.quizzes_played')}</p>
                                    )}
                                </div>

                                {/* Score */}
                                <div className="text-right">
                                    <div className={`text-2xl font-bold ${rankColor}`}>
                                        {Math.round(participant.totalScore || participant.score || 0)}
                                    </div>
                                    <div className="text-xs text-ink-faint uppercase tracking-wider">{t('slide_editors.leaderboard.points')}</div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </ResultCard>
    );
};

export default LeaderboardResult;