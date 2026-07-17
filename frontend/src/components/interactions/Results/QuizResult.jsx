import { motion } from 'framer-motion';
import ResultCard from './ResultCard';
import { CheckCircle, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const QuizResult = ({ slide, data }) => {
    const { t } = useTranslation();
    const quizState = data?.quizState || {};
    const results = quizState.results || {};
    const correctCount = data?.correctCount || 0;
    const accuracy = data?.accuracy || 0;
    const totalResponses = data?.totalResponses || 0;

    const options = slide.quizSettings?.options || [];
    const correctOptionId = slide.quizSettings?.correctOptionId;

    return (
        <ResultCard slide={slide} totalResponses={totalResponses}>
            {/* Accuracy Header */}
            <div className="flex items-center justify-center mb-8">
                <div className="text-center p-6 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                    <div className="text-4xl font-bold text-indigo-400 mb-1">{Math.round(accuracy)}%</div>
                    <div className="text-sm text-indigo-300/70 uppercase tracking-wider font-medium">{t('slide_editors.quiz.correct_answers')}</div>
                </div>
            </div>

            <div className="space-y-4">
                {options.map((option, index) => {
                    const isCorrect = option.id === correctOptionId;
                    const count = results[option.id] || 0;
                    const percentage = totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0;

                    return (
                        <div key={option.id || index} className={`relative group quiz-option ${isCorrect ? 'quiz-correct' : ''}`}>
                            {/* Background Bar */}
                            <div className={`relative h-16 bg-slate-700/30 rounded-xl overflow-hidden border ${isCorrect ? 'border-green-500/20 bg-green-500/5' : 'border-white/5'} quiz-bar-container`}>
                                {/* Progress Fill */}
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ duration: 1, delay: index * 0.1 }}
                                    className={`absolute inset-y-0 left-0 transition-colors ${isCorrect ? 'bg-green-500/20 quiz-bar-fill' : 'bg-indigo-500/20 quiz-bar-fill'}`}
                                />

                                {/* Content */}
                                <div className="absolute inset-0 flex items-center justify-between px-6 quiz-bar-content">
                                    <div className="flex items-center gap-4">
                                        {isCorrect ? (
                                            <CheckCircle className="w-6 h-6 text-green-400" />
                                        ) : (
                                            <div className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 text-xs font-bold border border-white/10">
                                                {String.fromCharCode(65 + index)}
                                            </div>
                                        )}
                                        <span className={`font-medium text-lg ${isCorrect ? 'text-green-100' : 'text-slate-200'} quiz-option-text`}>
                                            {typeof option.text === 'string' 
                                              ? option.text 
                                              : (typeof option === 'string' ? option : `Option ${index + 1}`)}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4 quiz-stats">
                                        <span className="text-sm text-slate-400 quiz-votes">{count} {t('slide_editors.quiz.votes')}</span>
                                        <span className={`font-bold text-xl w-14 text-right ${isCorrect ? 'text-green-400' : 'text-indigo-400'} quiz-percentage`}>
                                            {percentage}%
                                        </span>
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

export default QuizResult;