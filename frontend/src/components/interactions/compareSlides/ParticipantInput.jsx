import { Send } from 'lucide-react';

const OptionCard = ({ side, option, fallbackLabel, isSelected, hasSubmitted, voteCount, totalResponses, onSelect }) => {
  const percentage = totalResponses > 0 ? Math.round((voteCount / totalResponses) * 100) : 0;

  return (
    <button
      type="button"
      onClick={() => !hasSubmitted && onSelect(side)}
      disabled={hasSubmitted}
      aria-label={`Select ${option?.label || fallbackLabel}`}
      className={`relative flex-1 rounded-xl overflow-hidden border-2 transition-all text-left ${
        isSelected
          ? 'border-primary bg-primary/5 shadow-[var(--shadow-level-1)]'
          : 'border-hairline bg-surface hover:bg-canvas-soft'
      } ${hasSubmitted ? 'cursor-default' : 'active:scale-[0.98]'}`}
    >
      {hasSubmitted && (
        <div
          className={`absolute inset-0 transition-all duration-500 ease-out ${isSelected ? 'bg-primary/10' : 'bg-canvas-soft'}`}
          style={{ width: `${percentage}%` }}
        />
      )}
      <div className="relative">
        {option?.contentType === 'image' && option?.imageUrl ? (
          <img src={option.imageUrl} alt={option?.label || fallbackLabel} className="w-full h-40 sm:h-56 object-cover" />
        ) : (
          <div className="h-40 sm:h-56 flex items-center justify-center p-4">
            <p className="text-base sm:text-lg font-semibold text-ink text-center">
              {option?.text || fallbackLabel}
            </p>
          </div>
        )}
        <div className="px-3 py-3 flex items-center justify-between border-t border-hairline">
          <span className="text-sm sm:text-base font-medium text-ink">{option?.label || fallbackLabel}</span>
          {hasSubmitted ? (
            <span className="text-sm sm:text-base font-bold text-primary">{percentage}% ({voteCount})</span>
          ) : isSelected ? (
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-on-primary text-sm font-bold">✓</span>
          ) : null}
        </div>
      </div>
    </button>
  );
};

const CompareSlidesParticipantInput = ({
  slide,
  selectedAnswer,
  onSelect,
  hasSubmitted,
  voteCounts = {},
  totalResponses = 0,
  onSubmit
}) => {
  if (!slide) return null;

  const optionA = slide.compareSettings?.optionA;
  const optionB = slide.compareSettings?.optionB;

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-8 sm:mb-12">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-ink text-center leading-tight">
          {typeof slide.question === 'string' ? slide.question : ''}
        </h2>
      </div>

      <div className="flex items-stretch gap-3 sm:gap-6 mb-6 sm:mb-8">
        <OptionCard
          side="A"
          option={optionA}
          fallbackLabel="Option A"
          isSelected={selectedAnswer === 'A'}
          hasSubmitted={hasSubmitted}
          voteCount={voteCounts.A || 0}
          totalResponses={totalResponses}
          onSelect={onSelect}
        />
        <div className="flex items-center justify-center text-sm sm:text-base font-bold text-ink-faint">VS</div>
        <OptionCard
          side="B"
          option={optionB}
          fallbackLabel="Option B"
          isSelected={selectedAnswer === 'B'}
          hasSubmitted={hasSubmitted}
          voteCount={voteCounts.B || 0}
          totalResponses={totalResponses}
          onSelect={onSelect}
        />
      </div>

      {hasSubmitted && totalResponses > 0 && (
        <div className="mt-2 mb-6 pt-6 border-t border-hairline">
          <div className="flex items-center justify-center gap-2 text-sm text-ink-muted">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            <span>Live results updating • {totalResponses} {totalResponses === 1 ? 'response' : 'responses'}</span>
          </div>
        </div>
      )}

      {!hasSubmitted && (
        <button
          onClick={onSubmit}
          disabled={!selectedAnswer}
          className="w-full py-3 sm:py-4 bg-primary hover:bg-primary-active disabled:bg-canvas-soft disabled:text-ink-faint text-on-primary rounded-full text-lg sm:text-xl font-semibold transition-all active:scale-95 disabled:active:scale-100 flex items-center justify-center gap-2"
        >
          <Send className="h-5 w-5" />
          Submit Answer
        </button>
      )}

      {hasSubmitted && (
        <div className="text-center py-6">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-primary/10 border border-primary/30">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            <p className="text-base sm:text-lg text-primary font-semibold">
              ✓ Response submitted! Viewing live results...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompareSlidesParticipantInput;
