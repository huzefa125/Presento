import { useState, useEffect } from 'react';
// eslint-disable-next-line
import { motion } from 'framer-motion';
import ResultCard from './ResultCard';
import { useTranslation } from 'react-i18next';

const QnaResult = ({ slide, data }) => {
    const { t } = useTranslation();
    const [localQuestions, setLocalQuestions] = useState([]);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        if (data?.questions) {
            setLocalQuestions(data.questions);
        }
    }, [data]);

    // Sort by upvotes if available, else by time
    const sortedQuestions = [...localQuestions].sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));

    const filteredQuestions = sortedQuestions.filter(q => {
        if (filter === 'answered') return q.isAnswered;
        if (filter === 'unanswered') return !q.isAnswered;
        return true;
    });

    return (
        <ResultCard slide={slide} totalResponses={localQuestions.length} qnaProp={{filter, setFilter}}>

            <div className="space-y-3">
            <div className="grid lg:grid-cols-4 md:grid-cols-3 grid-cols-2 gap-3">
                {filteredQuestions.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 italic">
                        {filter === 'all' 
                            ? t('presentation_results.common_labels.no_questions_submitted_yet') 
                            : `${t('presentation_results.filters.no')} ${t(`presentation_results.filters.${filter}`)} ${t('presentation_results.common_labels.questions')}`}
                    </div>
                ) : (
                    filteredQuestions.map((q, index) => (
                        <motion.div
                        key={q.id || index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.12, delay: index * 0.05, animation: 'linear' }}
                        className={`p-6 rounded-xl border transition-all ${q.isAnswered
                            ? 'bg-emerald-900/10 border-emerald-500/20'
                            : 'bg-slate-700/30 border-white/5 hover:border-emerald-500/30'
                            }`}
                        >
                            <div className="flex-1">
                                <p className={`text-lg mb-2 leading-relaxed ${q.isAnswered ? 'text-emerald-100' : 'text-slate-200'}`}>
                                    {q.text}
                                </p>
                                <div className="flex items-center justify-between text-xs text-slate-500">
                                    <span className="font-medium text-slate-400">{q.participantName || t('presentation_results.common_labels.anonymous')}</span>
                                    <div className="flex items-center gap-4">
                                        {q.submittedAt && (
                                            <span>{new Date(q.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
            </div>
        </ResultCard>
    );
};

export default QnaResult;
