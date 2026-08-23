import { motion } from 'framer-motion';
import ResultCard from './ResultCard';

const CompareSlidesResult = ({ slide, data }) => {
    const voteCounts = data?.voteCounts || {};
    const totalVotes = (voteCounts.A || 0) + (voteCounts.B || 0);
    const optionA = slide.compareSettings?.optionA;
    const optionB = slide.compareSettings?.optionB;

    const renderBar = (side, option, fallbackLabel, index) => {
        const count = voteCounts[side] || 0;
        const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        const optionLabel = option?.contentType === 'text' && option?.text ? option.text : (option?.label || fallbackLabel);

        return (
            <div key={side} className="relative group">
                <div className="relative h-14 bg-canvas-soft rounded-xl overflow-hidden border border-hairline progress-bar-container">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, delay: index * 0.1, ease: "easeOut" }}
                        className="absolute inset-y-0 left-0 bg-accent-sky/30 group-hover:bg-accent-sky/40 transition-colors progress-bar-fill"
                    />
                    <div className="absolute inset-0 flex items-center justify-between px-6 progress-bar-content">
                        <span className="font-medium text-ink truncate pr-4">{optionLabel}</span>
                        <div className="flex items-center gap-3 shrink-0">
                            <span className="text-sm text-ink-muted">{count} votes</span>
                            <span className="font-bold text-accent-sky w-12 text-right">{percentage}%</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <ResultCard slide={slide} totalResponses={totalVotes}>
            <div className="space-y-4">
                {renderBar('A', optionA, 'Option A', 0)}
                {renderBar('B', optionB, 'Option B', 1)}
            </div>
        </ResultCard>
    );
};

export default CompareSlidesResult;
