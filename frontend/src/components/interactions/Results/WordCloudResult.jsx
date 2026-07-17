import { motion } from 'framer-motion';
import ResultCard from './ResultCard';
import { useTranslation } from 'react-i18next';

const WordCloudResult = ({ slide, data }) => {
    const { t } = useTranslation();
    const wordFrequencies = data?.wordFrequencies || {};
    const words = Object.entries(wordFrequencies).map(([text, value]) => ({ text, value }));
    const totalWords = words.reduce((acc, curr) => acc + curr.value, 0);

    // Sort by frequency
    words.sort((a, b) => b.value - a.value);

    // Simple scaling for font size
    const maxVal = words[0]?.value || 1;
    const minSize = 14;
    const maxSize = 48;

    return (
        <ResultCard slide={slide} totalResponses={totalWords}>
            <div className="flex flex-wrap justify-center gap-4 p-8 min-h-[300px] items-center bg-slate-800/30 rounded-xl border border-white/5 word-cloud-container">
                {words.length === 0 ? (
                    <div className="text-slate-500 italic">{t('slide_editors.word_cloud.no_responses_yet')}</div>
                ) : (
                    words.map((word, index) => {
                        const size = minSize + ((word.value / maxVal) * (maxSize - minSize));

                        return (
                            <motion.span
                                key={word.text}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: index * 0.05 }}
                                className="inline-block font-bold text-slate-300 hover:text-purple-400 transition-colors cursor-default word-cloud-word"
                                style={{ fontSize: `${size}px` }}
                                title={`${word.value} ${t('slide_editors.word_cloud.occurrences')}`}
                            >
                                {word.text}
                            </motion.span>
                        );
                    })
                )}
            </div>
        </ResultCard>
    );
};

export default WordCloudResult;