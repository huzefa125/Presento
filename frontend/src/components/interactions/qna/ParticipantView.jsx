import { useState } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
// eslint-disable-next-line
import { motion, AnimatePresence } from 'framer-motion';

const MAX_CHARACTERS = 200;

const ParticipantQnaView = ({
  slide,
  questions = [],
  allowMultiple = false,
  activeQuestionId = null,
  onSubmit,
  participantId
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [questionText, setQuestionText] = useState('');

  const userQuestions = questions.filter(q => q.authorId === participantId);
  const hasAskedQuestion = userQuestions.length > 0;
  const canAskMore = allowMultiple || !hasAskedQuestion;

  const getQuestionStatus = (question) => {
    if (question.answered) {
      return { text: 'Answer given by presenter', color: 'bg-[#1D2A20] border border-[#2E7D32]/30 text-[#4CAF50]' };
    }
    if (activeQuestionId === question.id) {
      return { text: 'Presenter is answering your question', color: 'bg-[#1D2A20] border border-[#2E7D32]/30 text-[#4CAF50]' };
    }
    return { text: 'Waiting for presenter to answer', color: 'bg-[#2A2A2A] border border-[#2F2F2F] text-[#B0B0B0]' };
  };

  const handleSubmit = () => {
    const trimmed = questionText.trim();
    if (!trimmed) return;
    
    // Check if user can ask more questions
    if (!canAskMore) {
      return;
    }

    onSubmit(trimmed);
    setQuestionText('');
    setIsDrawerOpen(false);
  };

  const remainingCharacters = MAX_CHARACTERS - questionText.length;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 sm:space-y-8 px-2 sm:px-4">
      <div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#E0E0E0] text-center leading-tight px-2">
          {typeof slide?.question === 'string' 
            ? slide.question 
            : (slide.question?.text || slide.question?.label || 'Ask a Question')}
        </h2>
        <p className="text-center text-[#B0B0B0] mt-2 text-sm sm:text-base px-2">
          {allowMultiple 
            ? 'You can ask multiple questions.' 
            : 'You can ask one question for this slide.'}
        </p>
      </div>

      {/* Floating Ask Question Button */}
      {canAskMore && !isDrawerOpen && (
        <div className="fixed bottom-4 sm:bottom-8 right-4 sm:right-5 z-50">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-[#388E3C] to-[#2E7D32] hover:from-[#4CAF50] hover:to-[#388E3C] text-white rounded-full shadow-2xl font-semibold transition-all hover:scale-105 text-sm sm:text-base"
          >
            <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Ask a Question</span>
            <span className="sm:hidden">Ask</span>
          </button>
        </div>
      )}

      {/* Bottom Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/40 z-40"
            />

            {/* Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed w-full sm:w-2/3 md:w-1/2 lg:w-1/3 bottom-0 left-1/2 -translate-x-1/2 bg-[#1F1F1F] rounded-t-2xl sm:rounded-t-3xl shadow-2xl z-50 max-h-[85vh] sm:max-h-[80vh] overflow-hidden border-t border-[#2A2A2A]"
            >
              <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg sm:text-xl font-semibold text-[#E0E0E0]">Ask Your Question</h3>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-2 hover:bg-[#2A2A2A] rounded-full transition-colors touch-manipulation"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5 text-[#E0E0E0]" />
                  </button>
                </div>

                {/* Input */}
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value.slice(0, MAX_CHARACTERS))}
                  placeholder="Type your question here..."
                  rows={4}
                  className="w-full px-4 py-3 bg-[#2A2A2A] border border-[#2F2F2F] text-[#E0E0E0] rounded-xl resize-none focus:ring-2 focus:ring-[#4CAF50] focus:border-[#4CAF50] transition-shadow placeholder-[#6C6C6C]"
                  autoFocus
                />

                <div className="flex items-center justify-between text-sm text-[#6C6C6C]">
                  <span>{remainingCharacters} characters remaining</span>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={!questionText.trim() || !canAskMore}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#388E3C] to-[#2E7D32] hover:from-[#4CAF50] hover:to-[#388E3C] disabled:from-[#1F1F1F] disabled:to-[#1F1F1F] disabled:text-[#6C6C6C] text-white rounded-xl font-semibold transition-all active:scale-95 disabled:active:scale-100 shadow-lg shadow-[#4CAF50]/20 disabled:shadow-none"
                >
                  <Send className="h-5 w-5" />
                  Submit Question
                </button>
                {!canAskMore && (
                  <p className="text-xs text-[#EF5350] text-center">
                    You can only ask one question for this session
                  </p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* User's Submitted Questions */}
      {userQuestions.length > 0 && (
        <div className="bg-[#1F1F1F] rounded-2xl shadow-lg border border-[#2A2A2A] p-6 space-y-4">
          <h3 className="text-lg font-semibold text-[#E0E0E0]">Your Questions</h3>
          <div className="space-y-3">
            {userQuestions.map((q) => {
              const status = getQuestionStatus(q);
              return (
                <div
                  key={q.id}
                  className="p-4 bg-[#1F1F1F] border border-[#2A2A2A] rounded-xl space-y-3"
                >
                  <div>
                    <p className="text-[#E0E0E0] font-medium mb-2">{q.text}</p>
                    {q.answerText && (
                      <div className="mt-3 p-3 bg-[#1D2A20] border border-[#2E7D32]/30 rounded-lg">
                        <p className="text-xs font-semibold text-[#4CAF50] mb-1">Presenter's Answer:</p>
                        <p className="text-[#E0E0E0] text-sm whitespace-pre-wrap">{q.answerText}</p>
                      </div>
                    )}
                  </div>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                    {status.text}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!canAskMore && userQuestions.length === 0 && (
        <div className="bg-[#1D2A20] border border-[#2E7D32]/30 rounded-2xl p-6 text-center">
          <p className="text-[#4CAF50] font-medium">
            You've already asked your question. Thank you!
          </p>
        </div>
      )}
    </div>
  );
};

export default ParticipantQnaView;
