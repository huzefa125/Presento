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
                <div className="text-center p-6 bg-accent-purple/20 rounded-2xl border border-hairline">
                    <div className="text-4xl font-bold text-accent-purple-deep mb-1">{Math.round(accuracy)}%</div>
                    <div className="text-sm text-ink-muted uppercase tracking-wider font-medium">{t('slide_editors.quiz.correct_answers')}</div>
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
                            <div className={`relative h-16 bg-canvas-soft rounded-xl overflow-hidden border ${isCorrect ? 'border-accent-green/40 bg-accent-green/5' : 'border-hairline'} quiz-bar-container`}>
                                {/* Progress Fill */}
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ duration: 1, delay: index * 0.1 }}
                                    className={`absolute inset-y-0 left-0 transition-colors ${isCorrect ? 'bg-accent-green/25 quiz-bar-fill' : 'bg-accent-sky/25 quiz-bar-fill'}`}
                                />

                                {/* Content */}
                                <div className="absolute inset-0 flex items-center justify-between px-6 quiz-bar-content">
                                    <div className="flex items-center gap-4">
                                        {isCorrect ? (
                                            <CheckCircle className="w-6 h-6 text-accent-green" />
                                        ) : (
                                            <div className="w-6 h-6 flex items-center justify-center rounded-full bg-surface text-ink-muted text-xs font-bold border border-hairline">
                                                {String.fromCharCode(65 + index)}
                                            </div>
                                        )}
                                        <span className={`font-medium text-lg ${isCorrect ? 'text-accent-green' : 'text-ink'} quiz-option-text`}>
                                            {typeof option.text === 'string'
                                              ? option.text
                                              : (typeof option === 'string' ? option : `Option ${index + 1}`)}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4 quiz-stats">
                                        <span className="text-sm text-ink-muted quiz-votes">{count} {t('slide_editors.quiz.votes')}</span>
                                        <span className={`font-bold text-xl w-14 text-right ${isCorrect ? 'text-accent-green' : 'text-accent-sky'} quiz-percentage`}>
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