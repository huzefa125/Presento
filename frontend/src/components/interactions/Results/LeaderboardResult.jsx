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
                    <div className="text-center py-12 text-slate-500 italic">
                        {t('slide_editors.leaderboard.no_participants_yet')}
                    </div>
                ) : (
                    leaderboard.map((participant, index) => {
                        let rankColor = 'text-slate-400';
                        let bgColor = 'bg-slate-700/30';
                        let borderColor = 'border-white/5';
                        let iconColor = 'text-slate-600';

                        if (index === 0) {
                            rankColor = 'text-yellow-400';
                            bgColor = 'bg-yellow-500/10';
                            borderColor = 'border-yellow-500/30';
                            iconColor = 'text-yellow-500';
                        } else if (index === 1) {
                            rankColor = 'text-slate-300';
                            bgColor = 'bg-slate-400/10';
                            borderColor = 'border-slate-400/30';
                            iconColor = 'text-slate-400';
                        } else if (index === 2) {
                            rankColor = 'text-orange-300';
                            bgColor = 'bg-orange-500/10';
                            borderColor = 'border-orange-500/30';
                            iconColor = 'text-orange-400';
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
                                        <span className="text-xl font-bold text-[#6C6C6C]">#{index + 1}</span>
                                    )}
                                </div>

                                {/* Name */}
                                <div className="flex-1">
                                    <h4 className={`text-xl font-bold ${index === 0 ? 'text-[#E0E0E0] ' : 'text-[#B0B0B0]'}`}>
                                        {participant.participantName || t('slide_editors.leaderboard.anonymous')}
                                    </h4>
                                    {participant.quizCount !== undefined && (
                                        <p className="text-xs text-[#6C6C6C] mt-1">{participant.quizCount} {t('slide_editors.leaderboard.quizzes_played')}</p>
                                    )}
                                </div>

                                {/* Score */}
                                <div className="text-right">
                                    <div className={`text-2xl font-bold ${rankColor}`}>
                                        {Math.round(participant.totalScore || participant.score || 0)}
                                    </div>
                                    <div className="text-xs text-[#6C6C6C] uppercase tracking-wider">{t('slide_editors.leaderboard.points')}</div>
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