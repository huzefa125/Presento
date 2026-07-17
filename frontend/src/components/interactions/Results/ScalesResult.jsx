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
                            <div className="scale-header flex justify-between items-center mb-2 gap-4">
                                <h4 className="scale-label text-base font-medium text-ink">
                                    {typeof statement === 'string'
                                      ? statement
                                      : (statement?.text || statement?.label || `Statement ${index + 1}`)}
                                </h4>
                                <div className="scale-value text-lg font-bold text-accent-orange">{avg.toFixed(1)}</div>
                            </div>

                            <div className="scale-bar relative h-3 bg-canvas-soft rounded-full overflow-hidden border border-hairline">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ duration: 1, delay: index * 0.1 }}
                                    className="scale-fill h-full bg-accent-orange"
                                />
                            </div>

                            <div className="scale-labels flex justify-between text-xs text-ink-faint mt-1">
                                <span>{slide.minLabel || minValue}</span>
                                <span>{slide.maxLabel || maxValue}</span>
                            </div>
                        </div>
                    );
                })}

                {/* Overall Score */}
                {statements.length > 1 && (
                    <div className="mt-8 pt-8 border-t border-hairline flex items-center justify-center gap-4">
                        <span className="text-ink-muted uppercase tracking-wider text-sm">{t('slide_editors.scales.overall_score')}</span>
                        <div className="px-4 py-2 bg-accent-orange/10 rounded-lg border border-accent-orange/30 text-accent-orange font-bold text-xl">
                            {overallAverage.toFixed(1)}
                        </div>
                    </div>
                )}
            </div>
        </ResultCard>
    );
};

export default ScalesResult;