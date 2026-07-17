import { useState, useEffect } from 'react';
// eslint-disable-next-line
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, Check, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PresenterQnaView = ({
  slide,
  questions = [],
  totalResponses = 0,
  onMarkAnswered,
  onSetActiveQuestion
}) => {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerText, setAnswerText] = useState('');

  const unansweredQuestions = questions.filter(q => !q.answered);
  const currentQuestion = unansweredQuestions[currentIndex];

  // Reset answer text when question changes
  useEffect(() => {
    setAnswerText('');
  }, [currentQuestion?.id]);

  useEffect(() => {
    // Reset index when questions change
    if (currentIndex >= unansweredQuestions.length && unansweredQuestions.length > 0) {
      setCurrentIndex(unansweredQuestions.length - 1);
    }
  }, [unansweredQuestions.length, currentIndex]);

  useEffect(() => {
    // Notify backend about active question when it changes
    if (currentQuestion && onSetActiveQuestion) {
      onSetActiveQuestion(currentQuestion.id);
    }
  }, [currentQuestion?.id, onSetActiveQuestion, currentQuestion]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowUp' && currentIndex > 0) {
        e.preventDefault();
        setCurrentIndex(prev => prev - 1);
      } else if (e.key === 'ArrowDown' && currentIndex < unansweredQuestions.length - 1) {
        e.preventDefault();
        setCurrentIndex(prev => prev + 1);
      } else if (e.key === 'Enter' && currentQuestion) {
        e.preventDefault();
        handleMarkAnswered();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line
  }, [currentIndex, unansweredQuestions.length, currentQuestion]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < unansweredQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleMarkAnswered = () => {
    if (currentQuestion) {
      onMarkAnswered(currentQuestion.id, true, answerText.trim() || null);
      setAnswerText('');
      // Move to next question if available
      if (currentIndex >= unansweredQuestions.length - 1 && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleMarkAnswered();
    }
  };

  // Dynamic text size based on question length
  const getQuestionTextSize = (text) => {
    if (!text) return 'text-5xl';
    const length = text.length;
    
    if (length <= 20) return 'text-8xl';
    if (length <= 40) return 'text-7xl';
    if (length <= 60) return 'text-6xl';
    if (length <= 80) return 'text-5xl';
    if (length <= 100) return 'text-4xl';
    if (length <= 150) return 'text-3xl';
    if (length <= 200) return 'text-2xl';
    return 'text-2xl';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Slide Title Header */}
      <div className="text-center mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-ink">{slide?.question || t('slide_editors.qna.default_title')}</h1>
      </div>

      {unansweredQuestions.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <p className="text-xl sm:text-2xl text-ink-muted font-medium">{t('slide_editors.qna.waiting_for_questions')}</p>
            <p className="text-xs sm:text-sm text-ink-muted">{t('slide_editors.qna.questions_appear_here')}</p>
            <div className="mt-4 text-xs text-ink-faint space-y-1">
              <span>{totalResponses} question{totalResponses === 1 ? '' : 's'} submitted / </span>
              <span>{questions.filter(q => q.answered).length} answered</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Question Counter */}
          <div className="text-center mb-4">
            <p className="text-sm sm:text-base text-ink-faint">
              {currentIndex + 1}/{unansweredQuestions.length} Question
            </p>
          </div>

          {/* Question Display */}
          <div className="flex-1 flex flex-col items-center justify-center py-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion?.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="text-center space-y-6 max-w-5xl w-full px-4 sm:px-6"
              >
                <h2 className={`${getQuestionTextSize(currentQuestion?.text)} font-normal text-ink leading-tight`}>
                  {currentQuestion?.text}
                </h2>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Answer Input */}
          <div className="px-4 sm:px-6 mb-4">
            <div className="max-w-2xl mx-auto">
              <label className="block text-sm font-medium text-ink-muted mb-2">
                {t('slide_editors.qna.answer_label') || 'Your Answer'}
              </label>
              <div className="flex gap-2">
                <textarea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('slide_editors.qna.answer_placeholder') || 'Type your answer here...'}
                  className="flex-1 px-3 py-2 bg-surface border border-hairline rounded-lg text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-sm"
                  rows="2"
                  maxLength={1000}
                />
                <button
                  onClick={handleMarkAnswered}
                  disabled={!currentQuestion}
                  className="px-4 py-3 bg-primary hover:bg-primary-active disabled:bg-canvas-soft disabled:text-ink-faint text-on-primary rounded-lg font-medium transition-all active:scale-95 shadow-[var(--shadow-level-1)] disabled:shadow-none flex items-center gap-2"
                  title={t('slide_editors.qna.submit_answer') || 'Submit Answer (Ctrl+Enter)'}
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-ink-faint mt-1">
                {answerText.length}/1000 {t('slide_editors.qna.characters') || 'characters'} • {t('slide_editors.qna.press_ctrl_enter') || 'Press Ctrl+Enter to submit'}
              </p>
            </div>
          </div>

          {/* Navigation & Actions */}
          <div className="space-y-4 pb-2">
            {/* Navigation Arrows */}
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="p-2 rounded-full hover:bg-canvas-soft disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous question"
              >
                <ChevronUp className="h-5 w-5 text-ink" />
              </button>

              <button
                onClick={handleNext}
                disabled={currentIndex === unansweredQuestions.length - 1}
                className="p-2 rounded-full hover:bg-canvas-soft disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Next question"
              >
                <ChevronDown className="h-5 w-5 text-ink" />
              </button>
            </div>

            {/* Mark as Answered Button (without answer) */}
            <div className="flex justify-center">
              <button
                onClick={() => onMarkAnswered(currentQuestion?.id, true, null)}
                disabled={!currentQuestion}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface text-ink border border-hairline hover:bg-canvas-soft disabled:text-ink-faint text-sm font-medium rounded-full transition-all active:scale-95 shadow-[var(--shadow-level-1)] disabled:shadow-none"
              >
                <Check className="h-4 w-4" />
                <span>{t('slide_editors.qna.mark_answered') || 'Mark as Answered'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PresenterQnaView;
