import { useState, useEffect } from 'react';
import { Clock, Send, CheckCircle, XCircle, Trophy, Zap } from 'lucide-react';

const QuizParticipantInput = ({
  slide,
  quizState = {},
  hasSubmitted,
  submissionResult,
  voteCounts = {},
  totalResponses = 0,
  onSubmit
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [responseTime, setResponseTime] = useState(null);
  const [isTimedOut, setIsTimedOut] = useState(false);

  const quizSettings = slide?.quizSettings || {};
  const options = quizSettings.options || [];
  const timeLimit = quizSettings.timeLimit || 30;
  const isActive = quizState.isActive || false;
  const startTime = quizState.startTime;

  // Preserve selected answer from submission result
  useEffect(() => {
    if (hasSubmitted && submissionResult && submissionResult.answer) {
      setSelectedAnswer(submissionResult.answer);
    }
  }, [hasSubmitted, submissionResult]);

  // Track response time
  useEffect(() => {
    if (isActive && startTime && !hasSubmitted) {
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        setResponseTime(elapsed);
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isActive, startTime, hasSubmitted]);

  // Reset timeout state when quiz (re)starts or submission completes
  useEffect(() => {
    if (hasSubmitted || !isActive) {
      setIsTimedOut(false);
    }
  }, [hasSubmitted, isActive, startTime]);

  // Countdown timer
  useEffect(() => {
    if (!isActive || !startTime) {
      setTimeRemaining(null);
      setIsTimedOut(false);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, timeLimit - elapsed);
      setTimeRemaining(remaining);

      // Auto-submit when time runs out
      if (remaining === 0) {
        setIsTimedOut(true);
        if (!hasSubmitted && selectedAnswer) {
          handleSubmit();
        }
      }
    }, 100);

    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [isActive, startTime, timeLimit, hasSubmitted, selectedAnswer]);

  const handleSubmit = () => {
    if (!selectedAnswer || hasSubmitted || isTimedOut) return;
    onSubmit(selectedAnswer, responseTime);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timeRemaining === null) return 'bg-[#2A2A2A] text-[#6C6C6C] border border-[#2F2F2F]';
    if (timeRemaining <= 5) return 'bg-[#2A1F1F] border border-[#EF5350]/30 text-[#EF5350] animate-pulse';
    if (timeRemaining <= 10) return 'bg-[#2A2520] border border-[#FF9800]/30 text-[#FF9800]';
    return 'bg-[#1D2A20] border border-[#4CAF50]/30 text-[#4CAF50]';
  };

  if (!slide) return null;

  // Timed out without submission
  if (isTimedOut && !hasSubmitted) {
    return (
      <div className="w-full max-w-3xl mx-auto">
        <div className="bg-[#2A1F1F] border-2 border-[#EF5350]/30 rounded-2xl p-8 sm:p-10 text-center shadow-sm">
          <Clock className="h-14 w-14 sm:h-16 sm:w-16 text-[#EF5350] mx-auto mb-4" />
          <h3 className="text-2xl sm:text-3xl font-bold text-[#EF5350] mb-2">
            Time's up!
          </h3>
          <p className="text-base sm:text-lg text-[#E0E0E0]">
            {selectedAnswer ? 'Your answer was not submitted in time.' : 'No answer selected.'}
          </p>
          <p className="text-sm sm:text-base text-[#B0B0B0] mt-2">
            Better luck next time!
          </p>
        </div>
      </div>
    );
  }

  // Waiting for quiz to start
  if (!isActive && !hasSubmitted) {
    return (
      <div className="w-full max-w-3xl mx-auto">
        <div className="mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#E0E0E0] text-center leading-tight">
            {slide.question}
          </h2>
        </div>
        <div className="bg-[#1D2A20] border-2 border-[#2E7D32]/30 rounded-2xl p-6 sm:p-8 text-center">
          <Clock className="h-14 w-14 sm:h-16 sm:w-16 text-[#4CAF50] mx-auto mb-4" />
          <h3 className="text-xl sm:text-2xl font-bold text-[#E0E0E0] mb-2">
            Waiting for quiz to start...
          </h3>
          <p className="text-sm sm:text-base text-[#B0B0B0]">
            The presenter will start the countdown shortly
          </p>
        </div>
      </div>
    );
  }

  // Helper to get vote count for an option
  const getVoteCount = (optionId) => {
    // Try to find the option ID in voteCounts
    if (voteCounts[optionId] !== undefined) {
      return voteCounts[optionId];
    }
    // Try to find by option text
    const option = options.find(opt => opt.id === optionId);
    if (option && voteCounts[option.text]) {
      return voteCounts[option.text];
    }
    return 0;
  };

  // Get correct answer ID
  const correctAnswerId = quizSettings.correctAnswerId || null;

  // Show submission result (always show if submitted, even when quiz ends)
  if (hasSubmitted && submissionResult) {
    // Find the selected option text
    const selectedOption = options.find(opt => opt.id === submissionResult.answer || opt.id === selectedAnswer);
    const selectedOptionText = selectedOption?.text || 'Your answer';
    
    return (
      <div className="w-full max-w-3xl mx-auto space-y-6">
        <div className="mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#E0E0E0] text-center leading-tight">
            {slide.question}
          </h2>
        </div>

        {/* Submission Result - Always visible */}
        <div className={`rounded-2xl p-6 sm:p-8 text-center ${
          submissionResult.isCorrect 
            ? 'bg-[#1D2A20] border-2 border-[#2E7D32]/30' 
            : 'bg-[#2A1F1F] border-2 border-[#EF5350]/30'
        }`}>
          {submissionResult.isCorrect ? (
            <>
              <CheckCircle className="h-16 w-16 sm:h-20 sm:w-20 text-[#4CAF50] mx-auto mb-4" />
              <h3 className="text-2xl sm:text-3xl font-bold text-[#4CAF50] mb-2">
                Correct! 🎉
              </h3>
              <div className="mb-4">
                <p className="text-base sm:text-lg text-[#B0B0B0] mb-2">Your answer:</p>
                <p className="text-lg sm:text-xl font-semibold text-[#E0E0E0]">{selectedOptionText}</p>
              </div>
              <div className="flex items-center justify-center gap-2 mb-4">
                <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-[#FFD700]" />
                <span className="text-3xl sm:text-4xl font-bold text-[#E0E0E0]">
                  +{submissionResult.score}
                </span>
                <span className="text-lg sm:text-xl text-[#B0B0B0]">points</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-[#B0B0B0]">
                <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-sm sm:text-base">Response time: {(submissionResult.responseTime / 1000).toFixed(2)}s</span>
              </div>
            </>
          ) : (
            <>
              <XCircle className="h-16 w-16 sm:h-20 sm:w-20 text-[#EF5350] mx-auto mb-4" />
              <h3 className="text-2xl sm:text-3xl font-bold text-[#EF5350] mb-2">
                Incorrect
              </h3>
              <div className="mb-4">
                <p className="text-base sm:text-lg text-[#B0B0B0] mb-2">Your answer:</p>
                <p className="text-lg sm:text-xl font-semibold text-[#E0E0E0]">{selectedOptionText}</p>
              </div>
              {/* Show correct answer */}
              {correctAnswerId && (() => {
                const correctOption = options.find(opt => opt.id === correctAnswerId);
                return correctOption ? (
                  <div className="mt-4 p-3 bg-[#1D2A20]/50 border border-[#4CAF50]/30 rounded-lg">
                    <p className="text-sm text-[#4CAF50] font-semibold mb-1">Correct answer:</p>
                    <p className="text-base text-[#E0E0E0]">{correctOption.text}</p>
                  </div>
                ) : null;
              })()}
              <p className="text-base sm:text-lg text-[#E0E0E0] mt-4">
                Better luck on the next question!
              </p>
            </>
          )}
        </div>

        {/* Live Results */}
        {totalResponses > 0 && (
          <div className="bg-[#1F1F1F] rounded-2xl border border-[#2A2A2A] shadow-xl p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl sm:text-2xl font-semibold text-[#E0E0E0]">Live Results</h3>
              <div className="flex items-center gap-2 text-sm text-[#9E9E9E]">
                <div className="w-2 h-2 rounded-full bg-[#4CAF50] animate-pulse"></div>
                <span>{totalResponses} {totalResponses === 1 ? 'response' : 'responses'}</span>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {options.map((option) => {
                const voteCount = getVoteCount(option.id);
                const maxVotes = Math.max(...Object.values(voteCounts || {}), 1);
                const percentage = maxVotes > 0 ? (voteCount / maxVotes) * 100 : 0;
                const isCorrect = correctAnswerId === option.id;
                // Check if this is the participant's submitted answer
                const isSelected = (selectedAnswer === option.id) || 
                                 (hasSubmitted && submissionResult && 
                                  (submissionResult.answer === option.id || 
                                   submissionResult.selectedAnswer === option.id));
                
                return (
                  <div
                    key={option.id}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                      isCorrect
                        ? 'border-[#4CAF50] bg-[#1D2A20]/50'
                        : isSelected
                          ? 'border-[#FF9800] bg-[#2A2520]/50'
                          : 'border-[#2F2F2F] bg-[#2A2A2A]'
                    }`}
                  >
                    {/* Progress bar */}
                    <div
                      className={`absolute inset-0 transition-all duration-500 ${
                        isCorrect
                          ? 'bg-gradient-to-r from-[#4CAF50]/30 to-[#388E3C]/30'
                          : 'bg-gradient-to-r from-[#333333]/50 to-[#3A3A3A]/50'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                    
                    {/* Content */}
                    <div className="relative flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center gap-3 flex-1">
                        <span className={`text-base sm:text-lg font-semibold ${
                          isCorrect ? 'text-[#4CAF50]' : isSelected ? 'text-[#FF9800]' : 'text-[#E0E0E0]'
                        }`}>
                          {option.text}
                        </span>
                        {isCorrect && (
                          <span className="px-2 py-1 rounded bg-[#4CAF50]/20 text-[#4CAF50] text-xs font-bold">
                            ✓ Correct
                          </span>
                        )}
                        {isSelected && !isCorrect && (
                          <span className="px-2 py-1 rounded bg-[#EF5350]/20 text-[#EF5350] text-xs font-bold">
                            ✗ Your Answer (Incorrect)
                          </span>
                        )}
                        {isSelected && isCorrect && (
                          <span className="px-2 py-1 rounded bg-[#4CAF50]/20 text-[#4CAF50] text-xs font-bold">
                            ✓ Your Answer (Correct)
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-xl sm:text-2xl font-bold text-[#E0E0E0]">
                          {voteCount}
                        </div>
                        <div className="text-xs text-[#6C6C6C]">
                          {totalResponses > 0 ? `${((voteCount / totalResponses) * 100).toFixed(1)}%` : '0%'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="text-center py-4">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-[#1D2A20] border border-[#4CAF50]/30">
            <div className="w-2 h-2 rounded-full bg-[#4CAF50] animate-pulse"></div>
            <p className="text-sm sm:text-base text-[#4CAF50] font-semibold">
              Waiting for next slide...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Active quiz - answer selection
  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Question */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#E0E0E0] text-center leading-tight">
          {slide.question}
        </h2>
      </div>

      {/* Timer */}
      {timeRemaining !== null && (
        <div className={`mb-6 sm:mb-8 p-3 sm:p-4 rounded-xl ${getTimerColor()} flex items-center justify-center gap-3`}>
          <Clock className="h-5 w-5 sm:h-6 sm:w-6" />
          <span className="text-2xl sm:text-3xl font-bold">
            {formatTime(timeRemaining)}
          </span>
        </div>
      )}

      {/* Options */}
      <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => setSelectedAnswer(option.id)}
            disabled={hasSubmitted || isTimedOut}
            className={`w-full p-4 sm:p-6 rounded-xl text-left text-base sm:text-xl font-semibold transition-all active:scale-[0.98] ${
              selectedAnswer === option.id
                ? 'bg-gradient-to-r from-[#388E3C] to-[#2E7D32] text-white shadow-lg shadow-[#4CAF50]/30 scale-[1.02]'
                : 'bg-[#2A2A2A] text-[#E0E0E0] hover:bg-[#333333] border border-[#2F2F2F]'
            } ${hasSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {option.text}
          </button>
        ))}
      </div>

      {/* Submit Button */}
      {!hasSubmitted && !isTimedOut && (
        <div>
          <button
            onClick={handleSubmit}
            disabled={!selectedAnswer}
            className="w-full py-3 sm:py-4 bg-gradient-to-r from-[#388E3C] to-[#2E7D32] hover:from-[#4CAF50] hover:to-[#388E3C] disabled:from-[#1F1F1F] disabled:to-[#1F1F1F] disabled:text-[#6C6C6C] text-white rounded-xl text-lg sm:text-xl font-semibold transition-all active:scale-95 disabled:active:scale-100 flex items-center justify-center gap-2 disabled:cursor-not-allowed shadow-lg shadow-[#4CAF50]/20 disabled:shadow-none"
          >
            <Send className="h-5 w-5" />
            Submit Answer
          </button>
          {!selectedAnswer && (
            <p className="mt-2 text-center text-xs sm:text-sm text-[#6C6C6C]">
              Please select an option to submit
            </p>
          )}
        </div>
      )}

      {/* Info */}
      <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-[#6C6C6C]">
        <p>💡 Faster correct answers earn more points (500-1000)</p>
      </div>
    </div>
  );
};

export default QuizParticipantInput;
