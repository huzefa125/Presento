import { useEffect, useMemo, useState } from 'react';
import { Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const HundredPointsParticipantInput = ({ 
  slide, 
  onSubmit, 
  hasSubmitted, 
  initialAllocations = [],
  hundredPointsResults = [],
  totalResponses = 0
}) => {
  const { t } = useTranslation();
  const items = useMemo(() => Array.isArray(slide?.hundredPointsItems) ? slide.hundredPointsItems : [], [slide?.hundredPointsItems]);

  const [allocations, setAllocations] = useState(() => {
    const initial = {};
    items.forEach((item) => {
      initial[item.id] = 0;
    });
    
    if (Array.isArray(initialAllocations)) {
      initialAllocations.forEach((alloc) => {
        if (alloc && alloc.item && typeof alloc.points === 'number') {
          initial[alloc.item] = alloc.points;
        }
      });
    }
    
    return initial;
  });

  useEffect(() => {
    const initial = {};
    items.forEach((item) => {
      initial[item.id] = 0;
    });
    
    if (Array.isArray(initialAllocations)) {
      initialAllocations.forEach((alloc) => {
        if (alloc && alloc.item && typeof alloc.points === 'number') {
          initial[alloc.item] = alloc.points;
        }
      });
    }
    
    setAllocations(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slide?.id]);

  const totalAllocated = useMemo(() => {
    return Object.values(allocations).reduce((sum, points) => sum + points, 0);
  }, [allocations]);

  const pointsRemaining = 100 - totalAllocated;

  const handleAdjust = (itemId, delta) => {
    if (hasSubmitted) return;
    
    setAllocations((prev) => {
      const current = prev[itemId] || 0;
      const newValue = current + delta;
      
      // Don't allow negative values
      if (newValue < 0) return prev;
      
      // Don't allow exceeding 100 total
      const currentTotal = Object.values(prev).reduce((sum, points) => sum + points, 0);
      const newTotal = currentTotal - current + newValue;
      if (newTotal > 100) return prev;
      
      return {
        ...prev,
        [itemId]: newValue
      };
    });
  };

  const handleSubmit = async () => {
    if (hasSubmitted) return;
    if (totalAllocated === 0) return;
    if (totalAllocated > 100) return;
    
    const allocationArray = Object.entries(allocations)
    // eslint-disable-next-line
      .filter(([_, points]) => points > 0)
      .map(([item, points]) => ({ item, points }));
    
    await onSubmit(allocationArray);
  };

  if (!slide) return null;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 sm:space-y-6 py-2 sm:py-4 px-2 sm:px-4">
      <div className="text-left">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-ink mb-4 sm:mb-6 md:mb-8 px-2">
          {typeof slide.question === 'string'
            ? slide.question
            : (slide.question?.text || slide.question?.label || '')}
        </h2>
      </div>

      {hasSubmitted ? (
        <div className="space-y-6">
          {/* Submission confirmation */}
          <div className="rounded-xl border border-hairline bg-surface px-8 py-12 text-center shadow-[var(--shadow-level-1)]">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-canvas-soft">
              <svg className="h-10 w-10 text-accent-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-ink">{t('slide_editors.hundred_points.submitted_title') || 'Points allocated'}</h3>
            <p className="mt-2 text-sm text-ink-muted">Thanks for sharing your preferences. Viewing live results...</p>
          </div>

          {/* Live Results */}
          {hundredPointsResults.length > 0 && totalResponses > 0 && (
            <div className="rounded-xl border border-hairline bg-surface p-6 sm:p-8 shadow-[var(--shadow-level-1)]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl sm:text-2xl font-semibold text-ink">Live Results</h3>
                <div className="flex items-center gap-2 text-sm text-ink-muted">
                  <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse"></div>
                  <span>{totalResponses} {totalResponses === 1 ? 'response' : 'responses'}</span>
                </div>
              </div>

              <div className="space-y-4">
                {hundredPointsResults
                  .sort((a, b) => (b.averagePoints || 0) - (a.averagePoints || 0))
                  .map((result, index) => {
                    const item = items.find(i => i.id === result.itemId);
                    if (!item) return null;

                    const avgPoints = result.averagePoints || 0;
                    const maxAvg = Math.max(...hundredPointsResults.map(r => r.averagePoints || 0), 1);
                    const percentage = (avgPoints / maxAvg) * 100;

                    return (
                      <div key={result.itemId} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-base sm:text-lg font-semibold text-ink">{item.label}</span>
                          <div className="text-right">
                            <div className="text-lg sm:text-xl font-bold text-primary">
                              {avgPoints.toFixed(1)}
                            </div>
                            <div className="text-xs text-ink-faint">Avg Points</div>
                          </div>
                        </div>
                        <div className="h-8 bg-canvas-soft rounded-lg overflow-hidden border border-hairline">
                          <div
                            className="h-full bg-primary transition-all duration-500 flex items-center justify-end pr-3"
                            style={{ width: `${percentage}%` }}
                          >
                            <span className="text-sm font-bold text-on-primary">{avgPoints.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Items list */}
          <div className="space-y-6">
            {items.map((item) => (
              <div key={item.id} className="space-y-2">
                <div className="text-base sm:text-lg font-semibold text-ink">
                  {typeof item.label === 'string'
                    ? item.label
                    : (item.text || item.label?.text || item.label?.label || '')}
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => handleAdjust(item.id, -10)}
                    disabled={allocations[item.id] === 0 || hasSubmitted}
                    className={`flex h-10 sm:h-12 px-4 sm:px-6 items-center justify-center rounded-full text-sm sm:text-base font-medium transition touch-manipulation ${
                      allocations[item.id] === 0 || hasSubmitted
                        ? 'bg-canvas-soft text-ink-faint cursor-not-allowed'
                        : 'bg-surface border-2 border-primary text-primary hover:bg-canvas-soft active:scale-95'
                    }`}
                  >
                    -10
                  </button>

                  <div className="flex-1 flex h-10 sm:h-12 items-center justify-center rounded-xl sm:rounded-2xl border-2 border-hairline bg-surface text-lg sm:text-xl font-normal text-ink">
                    {allocations[item.id] || 0}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAdjust(item.id, 10)}
                    disabled={pointsRemaining < 10 || hasSubmitted}
                    className={`flex h-10 sm:h-12 px-4 sm:px-6 items-center justify-center rounded-full text-sm sm:text-base font-medium transition touch-manipulation ${
                      pointsRemaining < 10 || hasSubmitted
                        ? 'bg-canvas-soft text-ink-faint cursor-not-allowed'
                        : 'bg-surface border-2 border-hairline text-ink hover:bg-canvas-soft active:scale-95'
                    }`}
                  >
                    +10
                  </button>
                </div>
                <div className="text-sm text-ink-faint">{pointsRemaining} {t('slide_editors.hundred_points.points_left') || 'points left'}</div>
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-2 sm:pt-4">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={totalAllocated === 0 || totalAllocated > 100}
              className="mt-4 sm:mt-6 flex items-center gap-2 rounded-full bg-primary hover:bg-primary-active disabled:bg-canvas-soft disabled:text-ink-faint px-6 sm:px-8 py-2.5 sm:py-3 text-base sm:text-lg font-semibold text-on-primary transition-all active:scale-95 disabled:active:scale-100 disabled:cursor-not-allowed touch-manipulation"
            >
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
              {t('slide_editors.hundred_points.submit_allocation') || 'Submit allocation'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HundredPointsParticipantInput;