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
        <h1 className="text-xl sm:text-2xl font-semibold text-[#E0E0E0]">{slide?.question || t('slide_editors.qna.default_title')}</h1>
      </div>

      {unansweredQuestions.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <p className="text-xl sm:text-2xl text-[#6C6C6C] font-medium">{t('slide_editors.qna.waiting_for_questions')}</p>
            <p className="text-xs sm:text-sm text-[#6C6C6C]">{t('slide_editors.qna.questions_appear_here')}</p>
            <div className="mt-4 text-xs text-[#B0B0B0] space-y-1">
              <span>{totalResponses} question{totalResponses === 1 ? '' : 's'} submitted / </span>
              <span>{questions.filter(q => q.answered).length} answered</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Question Counter */}
          <div className="text-center mb-4">
            <p className="text-sm sm:text-base text-[#B0B0B0]">
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
                <h2 className={`${getQuestionTextSize(currentQuestion?.text)} font-normal text-[#E0E0E0] leading-tight`}>
                  {currentQuestion?.text}
                </h2>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Answer Input */}
          <div className="px-4 sm:px-6 mb-4">
            <div className="max-w-2xl mx-auto">
              <label className="block text-sm font-medium text-[#B0B0B0] mb-2">
                {t('slide_editors.qna.answer_label') || 'Your Answer'}
              </label>
              <div className="flex gap-2">
                <textarea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('slide_editors.qna.answer_placeholder') || 'Type your answer here...'}
                  className="flex-1 px-3 py-2 bg-[#2A2A2A] border border-[#3B3B3B] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent resize-none text-sm"
                  rows="2"
                  maxLength={1000}
                />
                <button
                  onClick={handleMarkAnswered}
                  disabled={!currentQuestion}
                  className="px-4 py-3 bg-gradient-to-r from-[#388E3C] to-[#2E7D32] hover:from-[#4CAF50] hover:to-[#388E3C] disabled:from-[#1F1F1F] disabled:to-[#1F1F1F] disabled:text-[#6C6C6C] text-white rounded-lg font-medium transition-all active:scale-95 shadow-lg shadow-[#4CAF50]/20 disabled:shadow-none flex items-center gap-2"
                  title={t('slide_editors.qna.submit_answer') || 'Submit Answer (Ctrl+Enter)'}
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-[#6C6C6C] mt-1">
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
                className="p-2 rounded-full hover:bg-[#2A2A2A] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous question"
              >
                <ChevronUp className="h-5 w-5 text-[#E0E0E0]" />
              </button>

              <button
                onClick={handleNext}
                disabled={currentIndex === unansweredQuestions.length - 1}
                className="p-2 rounded-full hover:bg-[#2A2A2A] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Next question"
              >
                <ChevronDown className="h-5 w-5 text-[#E0E0E0]" />
              </button>
            </div>

            {/* Mark as Answered Button (without answer) */}
            <div className="flex justify-center">
              <button
                onClick={() => onMarkAnswered(currentQuestion?.id, true, null)}
                disabled={!currentQuestion}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#555555] to-[#444444] hover:from-[#666666] hover:to-[#555555] disabled:from-[#1F1F1F] disabled:to-[#1F1F1F] disabled:text-[#6C6C6C] text-white rounded-full font-medium transition-all active:scale-95 text-sm shadow-lg disabled:shadow-none"
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
