import { motion } from 'framer-motion';
import ResultCard from './ResultCard';
import { useTranslation } from 'react-i18next';

const RankingResult = ({ slide, data }) => {
    const { t } = useTranslation();
    const rankingResults = data?.rankingResults || [];
    // Assuming totalResponses is passed down or can be inferred. 
    // rankingResults usually doesn't have total count directly attached in the array structure used here,
    // but let's assume the parent passes correct totalResponses.

    const maxScore = rankingResults[0]?.score || 1;

    return (
        <ResultCard slide={slide} totalResponses={data?.totalResponses || 0}>
            <div className="space-y-3">
                {rankingResults.map((item, index) => {
                    const percentage = maxScore > 0 ? (item.score / maxScore) * 100 : 0;

                    return (
                        <motion.div
                            key={item.id || index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="relative flex items-center p-4 bg-slate-700/30 rounded-xl border border-white/5 overflow-hidden"
                        >
                            {/* Background Bar for Score */}
                            <div
                                className="absolute inset-y-0 left-0 bg-yellow-500/10 transition-all duration-1000 ease-out"
                                style={{ width: `${percentage}%` }}
                            />

                            {/* Rank Number */}
                            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-slate-800 rounded-lg border border-white/10 text-yellow-500 font-bold text-lg z-10 mr-4">
                                {index + 1}
                            </div>

                            {/* Content */}
                            <div className="flex-1 z-10">
                                <h4 className="text-lg font-medium text-slate-200">
                                    {typeof item.label === 'string' 
                                      ? item.label 
                                      : (item.text || item.label?.text || item.label?.label || `Item ${index + 1}`)}
                                </h4>
                            </div>

                            {/* Score */}
                            <div className="z-10 text-right">
                                <span className="text-2xl font-bold text-yellow-400">{item.score}</span>
                                <span className="text-xs text-slate-500 block">{t('slide_editors.ranking.points')}</span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </ResultCard>
    );
};

export default RankingResult;