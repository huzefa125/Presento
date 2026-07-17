import { motion } from 'framer-motion';
import { ThumbsUp } from 'lucide-react';
import ResultCard from './ResultCard';
import { useTranslation } from 'react-i18next';

const OpenEndedResult = ({ slide, data }) => {
    const { t } = useTranslation();
    const responses = data?.responses || [];

    return (
        <ResultCard slide={slide} totalResponses={responses.length}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {responses.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-slate-500 italic">
                        {t('slide_editors.open_ended.no_responses_yet')}
                    </div>
                ) : (
                    responses.map((response, index) => (
                        <motion.div
                            key={response.id || index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="bg-slate-700/30 p-6 rounded-xl border border-white/5 hover:border-green-500/30 transition-colors"
                        >
                            <p className="text-slate-200 text-lg mb-4 leading-relaxed">"{response.text}"</p>
                            <div className="flex items-center justify-between text-xs text-slate-500">
                                <span>{response.participantName || t('slide_editors.open_ended.anonymous')}</span>
                                <div className="flex items-center gap-3">
                                    {response.votes > 0 && (
                                        <div className="flex items-center gap-1 text-slate-400">
                                            <ThumbsUp size={14} />
                                            <span>{response.votes}</span>
                                        </div>
                                    )}
                                    {response.submittedAt && (
                                        <span>{new Date(response.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </ResultCard>
    );
};

export default OpenEndedResult;