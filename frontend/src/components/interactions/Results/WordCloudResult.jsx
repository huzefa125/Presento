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

    // Sticker accent palette used purely for decorative word coloring (cycled by index)
    const WORD_COLORS = [
        'text-accent-sky',
        'text-accent-pink',
        'text-accent-teal',
        'text-accent-orange',
        'text-accent-purple-deep',
        'text-accent-green',
        'text-accent-brown',
    ];

    return (
        <ResultCard slide={slide} totalResponses={totalWords}>
            <div className="flex flex-wrap justify-center gap-4 p-8 min-h-[300px] items-center bg-canvas-soft rounded-xl border border-hairline word-cloud-container">
                {words.length === 0 ? (
                    <div className="text-ink-faint italic">{t('slide_editors.word_cloud.no_responses_yet')}</div>
                ) : (
                    words.map((word, index) => {
                        const size = minSize + ((word.value / maxVal) * (maxSize - minSize));

                        return (
                            <motion.span
                                key={word.text}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: index * 0.05 }}
                                className={`inline-block font-bold ${WORD_COLORS[index % WORD_COLORS.length]} hover:opacity-70 transition-opacity cursor-default word-cloud-word`}
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