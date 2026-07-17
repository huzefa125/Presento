import { motion } from 'framer-motion';
import ResultCard from './ResultCard';
import { useTranslation } from 'react-i18next';

const HundredPointsResult = ({ slide, data }) => {
    const { t } = useTranslation();
    const results = data?.hundredPointsResults || [];
    const totalResponses = data?.totalResponses || 0;

    // Sort by average points descending
    const sortedResults = [...results].sort((a, b) => b.averagePoints - a.averagePoints);

    return (
        <ResultCard slide={slide} totalResponses={totalResponses}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sortedResults.map((item, index) => (
                    <motion.div
                        key={item.id || index}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                        className="flex flex-col p-6 bg-canvas-soft rounded-2xl border border-hairline relative overflow-hidden"
                    >
                        {/* Circular Progress or similar could be cool, but let's do a clean bar/stat layout */}
                        <div className="flex justify-between items-start mb-4 z-10">
                            <h4 className="text-lg font-medium text-ink">
                                {typeof item.label === 'string'
                                  ? item.label
                                  : (item.text || item.label?.text || item.label?.label || `Item ${index + 1}`)}
                            </h4>
                            <div className="text-right">
                                <div className="text-3xl font-bold text-accent-pink">{Math.round(item.averagePoints)}</div>
                                <div className="text-xs text-ink-faint">{t('slide_editors.hundred_points.avg_points')}</div>
                            </div>
                        </div>

                        {/* Visual Bar */}
                        <div className="w-full h-3 bg-surface rounded-full overflow-hidden z-10 border border-hairline">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${item.averagePoints}%` }} // Max is 100
                                transition={{ duration: 1, delay: 0.2 + index * 0.1 }}
                                className="h-full bg-accent-pink"
                            />
                        </div>
                    </motion.div>
                ))}
            </div>
        </ResultCard>
    );
};

export default HundredPointsResult;