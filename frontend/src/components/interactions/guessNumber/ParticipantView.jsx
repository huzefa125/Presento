import { useState } from 'react';
import { Send, CheckCircle, XCircle } from 'lucide-react';

const ParticipantGuessView = ({
  slide,
  onSubmit,
  hasSubmitted,
  guessDistribution = {},
  totalResponses = 0
}) => {
  const minValue = slide?.guessNumberSettings?.minValue ?? 1;
  const maxValue = slide?.guessNumberSettings?.maxValue ?? 10;
  const correctAnswer = slide?.guessNumberSettings?.correctAnswer ?? null;
  const [guess, setGuess] = useState(minValue);
  
  // Check if guess is correct
  const isCorrect = correctAnswer !== null && Number(guess) === Number(correctAnswer);

  const handleSubmit = () => {
    if (onSubmit && !hasSubmitted) {
      onSubmit(guess);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 sm:space-y-8 px-2 sm:px-4">
      <div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#E0E0E0] text-center leading-tight px-2">
          {typeof slide?.question === 'string' 
            ? slide.question 
            : (slide.question?.text || slide.question?.label || 'Guess the Number')}
        </h2>
        <p className="text-center text-[#B0B0B0] mt-2 text-sm sm:text-base px-2">
          Use the slider to make your guess
        </p>
      </div>

      {!hasSubmitted ? (
        <div className="bg-[#1F1F1F] rounded-2xl shadow-lg border border-[#2A2A2A] p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
          {/* Current Value Display */}
          <div className="text-center">
            <div className="inline-block px-4 sm:px-6 md:px-8 py-3 sm:py-4 bg-[#1D2A20] rounded-xl sm:rounded-2xl">
              <p className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#4CAF50]">{guess}</p>
            </div>
          </div>

          {/* Slider */}
          <div className="space-y-4">
            <input
              type="range"
              min={minValue}
              max={maxValue}
              value={guess}
              onChange={(e) => setGuess(Number(e.target.value))}
              className="w-full h-3 bg-[#2A2A2A] rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #4CAF50 0%, #4CAF50 ${((guess - minValue) / (maxValue - minValue)) * 100}%, #2A2A2A ${((guess - minValue) / (maxValue - minValue)) * 100}%, #2A2A2A 100%)`
              }}
            />
            <div className="flex justify-between text-sm text-[#6C6C6C]">
              <span>{minValue}</span>
              <span>{maxValue}</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            className="w-full flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-[#388E3C] to-[#2E7D32] hover:from-[#4CAF50] hover:to-[#388E3C] text-white rounded-xl font-semibold text-base sm:text-lg transition-all active:scale-95 shadow-lg shadow-[#4CAF50]/20 touch-manipulation"
          >
            <Send className="h-4 w-4 sm:h-5 sm:w-5" />
            Submit Guess
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Submission confirmation with correct/incorrect feedback */}
          <div className={`rounded-2xl p-8 text-center ${
            isCorrect
              ? 'bg-[#1D2A20] border-2 border-[#2E7D32]/30'
              : 'bg-[#2A1F1F] border-2 border-[#EF5350]/30'
          }`}>
            {isCorrect ? (
              <>
                <CheckCircle className="h-16 w-16 sm:h-20 sm:w-20 text-[#4CAF50] mx-auto mb-4" />
                <h3 className="text-2xl sm:text-3xl font-bold text-[#4CAF50] mb-2">
                  Correct! 🎉
                </h3>
                <p className="text-lg sm:text-xl text-[#E0E0E0] mb-1">
                  You guessed: <span className="font-bold text-2xl sm:text-3xl text-[#4CAF50]">{guess}</span>
                </p>
                <p className="text-sm text-[#B0B0B0] mt-2">Great job! Viewing live distribution...</p>
              </>
            ) : (
              <>
                <XCircle className="h-16 w-16 sm:h-20 sm:w-20 text-[#EF5350] mx-auto mb-4" />
                <h3 className="text-2xl sm:text-3xl font-bold text-[#EF5350] mb-2">
                  Incorrect
                </h3>
                <p className="text-lg sm:text-xl text-[#E0E0E0] mb-1">
                  You guessed: <span className="font-bold text-2xl sm:text-3xl text-[#EF5350]">{guess}</span>
                </p>
                {correctAnswer !== null && (
                  <div className="mt-4 p-3 bg-[#1D2A20]/50 border border-[#4CAF50]/30 rounded-lg">
                    <p className="text-sm text-[#4CAF50] font-semibold mb-1">Correct answer:</p>
                    <p className="text-xl font-bold text-[#E0E0E0]">{correctAnswer}</p>
                  </div>
                )}
                <p className="text-sm text-[#B0B0B0] mt-2">Better luck next time! Viewing live distribution...</p>
              </>
            )}
          </div>

          {/* Live Distribution */}
          {totalResponses > 0 && Object.keys(guessDistribution).length > 0 && (
            <div className="bg-[#1F1F1F] rounded-2xl border border-[#2A2A2A] shadow-xl p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl sm:text-2xl font-semibold text-[#E0E0E0]">Live Distribution</h3>
                <div className="flex items-center gap-2 text-sm text-[#9E9E9E]">
                  <div className="w-2 h-2 rounded-full bg-[#4CAF50] animate-pulse"></div>
                  <span>{totalResponses} {totalResponses === 1 ? 'guess' : 'guesses'}</span>
                </div>
              </div>

              <div className="space-y-3">
                {Object.entries(guessDistribution)
                  .sort((a, b) => Number(a[0]) - Number(b[0]))
                  .map(([value, count]) => {
                    const maxCount = Math.max(...Object.values(guessDistribution), 1);
                    const percentage = (count / maxCount) * 100;
                    const isYourGuess = Number(value) === guess;
                    const isCorrectAnswer = correctAnswer !== null && Number(value) === Number(correctAnswer);
                    
                    return (
                      <div key={value} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${
                              isCorrectAnswer 
                                ? 'text-[#4CAF50]' 
                                : isYourGuess 
                                  ? isCorrect 
                                    ? 'text-[#4CAF50]' 
                                    : 'text-[#EF5350]'
                                  : 'text-[#E0E0E0]'
                            }`}>
                              {value}
                            </span>
                            {isCorrectAnswer && (
                              <span className="px-2 py-1 rounded bg-[#4CAF50]/20 text-[#4CAF50] text-xs font-bold">
                                ✓ Correct
                              </span>
                            )}
                            {isYourGuess && !isCorrectAnswer && (
                              <span className="px-2 py-1 rounded bg-[#EF5350]/20 text-[#EF5350] text-xs font-bold">
                                ✗ Your Guess
                              </span>
                            )}
                            {isYourGuess && isCorrectAnswer && (
                              <span className="px-2 py-1 rounded bg-[#4CAF50]/20 text-[#4CAF50] text-xs font-bold">
                                ✓ Your Guess (Correct)
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-bold text-[#E0E0E0]">{count}</span>
                        </div>
                        <div className="h-6 bg-[#2A2A2A] rounded-lg overflow-hidden border border-[#2F2F2F]">
                          <div
                            className={`h-full transition-all duration-500 flex items-center justify-end pr-2 ${
                              isCorrectAnswer
                                ? 'bg-gradient-to-r from-[#4CAF50] to-[#388E3C]'
                                : isYourGuess
                                  ? isCorrect
                                    ? 'bg-gradient-to-r from-[#4CAF50] to-[#388E3C]'
                                    : 'bg-gradient-to-r from-[#EF5350] to-[#D32F2F]'
                                  : 'bg-gradient-to-r from-[#388E3C]/60 to-[#4CAF50]/60'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          background: #4CAF50;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        .slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          background: #4CAF50;
          border-radius: 50%;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
};

export default ParticipantGuessView;
