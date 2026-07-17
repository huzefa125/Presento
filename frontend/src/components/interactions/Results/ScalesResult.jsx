import { motion } from 'framer-motion';
import ResultCard from './ResultCard';
import { useTranslation } from 'react-i18next';

const ScalesResult = ({ slide, data }) => {
    const { t } = useTranslation();
    const statements = slide.statements || [];
    const averages = data?.scaleStatementAverages || [];
    const overallAverage = data?.scaleOverallAverage || 0;
    const totalResponses = data?.statementCounts?.[0] || 0; // Assuming all statements have roughly same response count if required

    const minValue = slide.minValue || 1;
    const maxValue = slide.maxValue || 5;
    const range = maxValue - minValue;

    return (
        <ResultCard slide={slide} totalResponses={totalResponses}>
            <div className="space-y-8">
                {statements.map((statement, index) => {
                    const avg = averages[index] || 0;
                    // Calculate percentage position relative to min/max
                    // If avg is 3 on 1-5 scale: (3-1)/(5-1) = 2/4 = 50%
                    const percentage = range > 0 ? ((avg - minValue) / range) * 100 : 0;

                    return (
                        <div key={index} className="scale-container">
                            <div className="scale-header">
                                <h4 className="scale-label">
                                    {typeof statement === 'string' 
                                      ? statement 
                                      : (statement?.text || statement?.label || `Statement ${index + 1}`)}
                                </h4>
                                <div className="scale-value">{avg.toFixed(1)}</div>
                            </div>

                            <div className="scale-bar">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ duration: 1, delay: index * 0.1 }}
                                    className="scale-fill"
                                />
                            </div>

                            <div className="scale-labels">
                                <span>{slide.minLabel || minValue}</span>
                                <span>{slide.maxLabel || maxValue}</span>
                            </div>
                        </div>
                    );
                })}

                {/* Overall Score */}
                {statements.length > 1 && (
                    <div className="mt-8 pt-8 border-t border-white/10 flex items-center justify-center gap-4">
                        <span className="text-slate-400 uppercase tracking-wider text-sm">{t('slide_editors.scales.overall_score')}</span>
                        <div className="px-4 py-2 bg-orange-500/20 rounded-lg border border-orange-500/30 text-orange-400 font-bold text-xl">
                            {overallAverage.toFixed(1)}
                        </div>
                    </div>
                )}
            </div>
        </ResultCard>
    );
};

export default ScalesResult;