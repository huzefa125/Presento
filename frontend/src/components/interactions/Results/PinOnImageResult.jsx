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
                    <div className="relative rounded-xl overflow-hidden border-2 border-slate-600 bg-slate-800">
                        <img
                            src={imageUrl}
                            alt={t('presentation_results.common_labels.pin_target')}
                            className="max-w-full h-auto max-h-[500px] object-contain"
                        />

                        {/* Correct Area Highlight (Optional) */}
                        {correctArea && (
                            <div
                                className="absolute border-2 border-green-500 bg-green-500/10 pointer-events-none"
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
                                <div className="w-3 h-3 bg-red-500 rounded-full shadow-lg shadow-red-500/50 border border-white/50" />
                                <div className="w-0.5 h-3 bg-white/50 mx-auto mt-[-2px]" />
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-slate-500 italic py-12">{t('presentation_results.common_labels.image_not_found')}</div>
                )}
            </div>
        </ResultCard>
    );
};

export default PinOnImageResult;
