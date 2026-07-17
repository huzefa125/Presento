import { motion } from 'framer-motion';
import ResultCard from './ResultCard';
import { useTranslation } from 'react-i18next';

const MCQResult = ({ slide, data }) => {
    const { t } = useTranslation();
    const voteCounts = data?.voteCounts || {};
    const totalVotes = Object.values(voteCounts).reduce((a, b) => a + b, 0);

    return (
        <ResultCard slide={slide} totalResponses={totalVotes}>
            <div className="space-y-4">
                {slide.options?.map((option, index) => {
                    const optionText = typeof option === 'string' ? option : (option?.text || `Option ${index + 1}`);
                    const key = typeof option === 'string' ? option : (option?.text || String(option));
                    const count = voteCounts[key] || 0;
                    const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;

                    return (
                        <div key={index} className="relative group">
                            {/* Background Bar */}
                            <div className="relative h-14 bg-canvas-soft rounded-xl overflow-hidden border border-hairline progress-bar-container">
                                {/* Progress Fill */}
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ duration: 1, delay: index * 0.1, ease: "easeOut" }}
                                    className="absolute inset-y-0 left-0 bg-accent-sky/30 group-hover:bg-accent-sky/40 transition-colors progress-bar-fill"
                                />

                                {/* Content */}
                                <div className="absolute inset-0 flex items-center justify-between px-6 progress-bar-content">
                                    <span className="font-medium text-ink">{optionText}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-ink-muted">{count} {t('slide_editors.mcq.votes')}</span>
                                        <span className="font-bold text-accent-sky w-12 text-right">{percentage}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </ResultCard>
    );
};

export default MCQResult;