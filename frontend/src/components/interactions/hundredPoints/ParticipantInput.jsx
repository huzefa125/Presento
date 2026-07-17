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
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#E0E0E0] mb-4 sm:mb-6 md:mb-8 px-2">
          {typeof slide.question === 'string' 
            ? slide.question 
            : (slide.question?.text || slide.question?.label || '')}
        </h2>
      </div>

      {hasSubmitted ? (
        <div className="space-y-6">
          {/* Submission confirmation */}
          <div className="rounded-3xl border border-[#4CAF50]/30 bg-[#1D2A20] px-8 py-12 text-center shadow-lg">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#2E7D32]/20">
              <svg className="h-10 w-10 text-[#4CAF50]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[#E0E0E0]">{t('slide_editors.hundred_points.submitted_title') || 'Points allocated'}</h3>
            <p className="mt-2 text-sm text-[#B0B0B0]">Thanks for sharing your preferences. Viewing live results...</p>
          </div>

          {/* Live Results */}
          {hundredPointsResults.length > 0 && totalResponses > 0 && (
            <div className="rounded-3xl border border-[#2A2A2A] bg-[#1F1F1F] p-6 sm:p-8 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl sm:text-2xl font-semibold text-[#E0E0E0]">Live Results</h3>
                <div className="flex items-center gap-2 text-sm text-[#9E9E9E]">
                  <div className="w-2 h-2 rounded-full bg-[#4CAF50] animate-pulse"></div>
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
                          <span className="text-base sm:text-lg font-semibold text-[#E0E0E0]">{item.label}</span>
                          <div className="text-right">
                            <div className="text-lg sm:text-xl font-bold text-[#4CAF50]">
                              {avgPoints.toFixed(1)}
                            </div>
                            <div className="text-xs text-[#6C6C6C]">Avg Points</div>
                          </div>
                        </div>
                        <div className="h-8 bg-[#2A2A2A] rounded-lg overflow-hidden border border-[#2F2F2F]">
                          <div
                            className="h-full bg-gradient-to-r from-[#388E3C] to-[#4CAF50] transition-all duration-500 flex items-center justify-end pr-3"
                            style={{ width: `${percentage}%` }}
                          >
                            <span className="text-sm font-bold text-white">{avgPoints.toFixed(1)}</span>
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
                <div className="text-base sm:text-lg font-semibold text-[#E0E0E0]">
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
                        ? 'bg-[#2A2A2A] text-[#6C6C6C] cursor-not-allowed'
                        : 'bg-[#1F1F1F] border-2 border-[#4CAF50] text-[#4CAF50] hover:bg-[#2A2A2A] active:scale-95'
                    }`}
                  >
                    -10
                  </button>
                  
                  <div className="flex-1 flex h-10 sm:h-12 items-center justify-center rounded-xl sm:rounded-2xl border-2 border-[#2A2A2A] bg-[#1F1F1F] text-lg sm:text-xl font-normal text-[#E0E0E0]">
                    {allocations[item.id] || 0}
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => handleAdjust(item.id, 10)}
                    disabled={pointsRemaining < 10 || hasSubmitted}
                    className={`flex h-10 sm:h-12 px-4 sm:px-6 items-center justify-center rounded-full text-sm sm:text-base font-medium transition touch-manipulation ${
                      pointsRemaining < 10 || hasSubmitted
                        ? 'bg-[#2A2A2A] text-[#6C6C6C] cursor-not-allowed'
                        : 'bg-[#1F1F1F] border-2 border-[#2A2A2A] text-[#E0E0E0] hover:bg-[#2A2A2A] active:scale-95'
                    }`}
                  >
                    +10
                  </button>
                </div>
                <div className="text-sm text-[#6C6C6C]">{pointsRemaining} {t('slide_editors.hundred_points.points_left') || 'points left'}</div>
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-2 sm:pt-4">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={totalAllocated === 0 || totalAllocated > 100}
              className="mt-4 sm:mt-6 flex items-center gap-2 rounded-full bg-gradient-to-r from-[#388E3C] to-[#2E7D32] hover:from-[#4CAF50] hover:to-[#388E3C] disabled:from-[#1F1F1F] disabled:to-[#1F1F1F] disabled:text-[#6C6C6C] px-6 sm:px-8 py-2.5 sm:py-3 text-base sm:text-lg font-semibold text-white transition-all active:scale-95 disabled:active:scale-100 shadow-lg shadow-[#4CAF50]/20 disabled:shadow-none disabled:cursor-not-allowed touch-manipulation"
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