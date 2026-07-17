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
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-ink text-center leading-tight px-2">
          {typeof slide?.question === 'string'
            ? slide.question
            : (slide.question?.text || slide.question?.label || 'Guess the Number')}
        </h2>
        <p className="text-center text-ink-muted mt-2 text-sm sm:text-base px-2">
          Use the slider to make your guess
        </p>
      </div>

      {!hasSubmitted ? (
        <div className="bg-surface rounded-2xl shadow-[var(--shadow-level-1)] border border-hairline p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
          {/* Current Value Display */}
          <div className="text-center">
            <div className="inline-block px-4 sm:px-6 md:px-8 py-3 sm:py-4 bg-canvas-soft rounded-xl sm:rounded-2xl">
              <p className="text-4xl sm:text-5xl md:text-6xl font-bold text-primary">{guess}</p>
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
              className="w-full h-3 bg-canvas-soft rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #0075de 0%, #0075de ${((guess - minValue) / (maxValue - minValue)) * 100}%, #f6f5f4 ${((guess - minValue) / (maxValue - minValue)) * 100}%, #f6f5f4 100%)`
              }}
            />
            <div className="flex justify-between text-sm text-ink-faint">
              <span>{minValue}</span>
              <span>{maxValue}</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            className="w-full flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-4 bg-primary hover:bg-primary-active text-on-primary rounded-full font-semibold text-base sm:text-lg transition-all active:scale-95 touch-manipulation"
          >
            <Send className="h-4 w-4 sm:h-5 sm:w-5" />
            Submit Guess
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Submission confirmation with correct/incorrect feedback */}
          <div className={`rounded-2xl p-8 text-center border ${
            isCorrect
              ? 'bg-surface border-accent-green/30'
              : 'bg-surface border-accent-orange-deep/30'
          }`}>
            {isCorrect ? (
              <>
                <CheckCircle className="h-16 w-16 sm:h-20 sm:w-20 text-accent-green mx-auto mb-4" />
                <h3 className="text-2xl sm:text-3xl font-bold text-accent-green mb-2">
                  Correct! 🎉
                </h3>
                <p className="text-lg sm:text-xl text-ink mb-1">
                  You guessed: <span className="font-bold text-2xl sm:text-3xl text-accent-green">{guess}</span>
                </p>
                <p className="text-sm text-ink-muted mt-2">Great job! Viewing live distribution...</p>
              </>
            ) : (
              <>
                <XCircle className="h-16 w-16 sm:h-20 sm:w-20 text-accent-orange-deep mx-auto mb-4" />
                <h3 className="text-2xl sm:text-3xl font-bold text-accent-orange-deep mb-2">
                  Incorrect
                </h3>
                <p className="text-lg sm:text-xl text-ink mb-1">
                  You guessed: <span className="font-bold text-2xl sm:text-3xl text-accent-orange-deep">{guess}</span>
                </p>
                {correctAnswer !== null && (
                  <div className="mt-4 p-3 bg-canvas-soft border border-accent-green/30 rounded-lg">
                    <p className="text-sm text-accent-green font-semibold mb-1">Correct answer:</p>
                    <p className="text-xl font-bold text-ink">{correctAnswer}</p>
                  </div>
                )}
                <p className="text-sm text-ink-muted mt-2">Better luck next time! Viewing live distribution...</p>
              </>
            )}
          </div>

          {/* Live Distribution */}
          {totalResponses > 0 && Object.keys(guessDistribution).length > 0 && (
            <div className="bg-surface rounded-2xl border border-hairline shadow-[var(--shadow-level-1)] p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl sm:text-2xl font-semibold text-ink">Live Distribution</h3>
                <div className="flex items-center gap-2 text-sm text-ink-muted">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
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
                                ? 'text-accent-green'
                                : isYourGuess
                                  ? isCorrect
                                    ? 'text-accent-green'
                                    : 'text-accent-orange-deep'
                                  : 'text-ink'
                            }`}>
                              {value}
                            </span>
                            {isCorrectAnswer && (
                              <span className="px-2 py-1 rounded bg-accent-green/15 text-accent-green text-xs font-bold">
                                ✓ Correct
                              </span>
                            )}
                            {isYourGuess && !isCorrectAnswer && (
                              <span className="px-2 py-1 rounded bg-accent-orange-deep/15 text-accent-orange-deep text-xs font-bold">
                                ✗ Your Guess
                              </span>
                            )}
                            {isYourGuess && isCorrectAnswer && (
                              <span className="px-2 py-1 rounded bg-accent-green/15 text-accent-green text-xs font-bold">
                                ✓ Your Guess (Correct)
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-bold text-ink">{count}</span>
                        </div>
                        <div className="h-6 bg-canvas-soft rounded-lg overflow-hidden border border-hairline">
                          <div
                            className={`h-full transition-all duration-500 flex items-center justify-end pr-2 ${
                              isCorrectAnswer
                                ? 'bg-accent-green'
                                : isYourGuess
                                  ? isCorrect
                                    ? 'bg-accent-green'
                                    : 'bg-accent-orange-deep'
                                  : 'bg-primary/50'
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
          background: #0075de;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
        }
        .slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          background: #0075de;
          border-radius: 50%;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </div>
  );
};

export default ParticipantGuessView;
