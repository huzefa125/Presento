import { motion } from 'framer-motion';
import ResultCard from './ResultCard';
import { useTranslation } from 'react-i18next';

const PinOnImageResult = ({ slide, data }) => {
    const { t } = useTranslation();
    const results = data?.pinResults || [];
    const totalResponses = results.length;
    const imageUrl = slide.pinOnImageSettings?.imageUrl;
    const correctArea = slide.pinOnImageSettings?.correctArea;

    return (
        <ResultCard slide={slide} totalResponses={totalResponses}>
            <div className="flex flex-col items-center justify-center max-w-4xl mx-auto">
                {imageUrl ? (
                    <div className="relative rounded-xl overflow-hidden border border-hairline bg-canvas-soft">
                        <img
                            src={imageUrl}
                            alt={t('presentation_results.common_labels.pin_target')}
                            className="max-w-full h-auto max-h-[500px] object-contain"
                        />

                        {/* Correct Area Highlight (Optional) */}
                        {correctArea && (
                            <div
                                className="absolute border-2 border-accent-green bg-accent-green/10 pointer-events-none"
                                style={{
                                    left: `${correctArea.x}%`,
                                    top: `${correctArea.y}%`,
                                    width: `${correctArea.width}%`,
                                    height: `${correctArea.height}%`
                                }}
                            />
                        )}

                        {/* Pins */}
                        {results.map((result, index) => (
                            <motion.div
                                key={index}
                                initial={{ scale: 0, y: -10, opacity: 0 }}
                                animate={{ scale: 1, y: 0, opacity: 1 }}
                                transition={{ duration: 0.3, delay: index * 0.02 }}
                                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                                style={{
                                    left: `${result.x}%`,
                                    top: `${result.y}%`
                                }}
                                title={result.participantName}
                            >
                                <div className="w-3 h-3 bg-accent-pink rounded-full shadow-[var(--shadow-level-1)] border border-surface" />
                                <div className="w-0.5 h-3 bg-accent-pink/50 mx-auto mt-[-2px]" />
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-ink-faint italic py-12">{t('presentation_results.common_labels.image_not_found')}</div>
                )}
            </div>
        </ResultCard>
    );
};

export default PinOnImageResult;
