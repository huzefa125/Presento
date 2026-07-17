import { useEffect, useMemo, useState } from 'react';
import { Send } from 'lucide-react';

const TwoByTwoGridParticipantInput = ({ 
  slide, 
  onSubmit, 
  hasSubmitted,
  gridResults = [],
  totalResponses = 0
}) => {
  const items = useMemo(() => Array.isArray(slide?.gridItems) ? slide.gridItems : [], [slide?.gridItems]);

  const axisXLabel = useMemo(() => slide?.gridAxisXLabel || 'Horizontal', [slide?.gridAxisXLabel]);

  const axisYLabel = useMemo(() => slide?.gridAxisYLabel || 'Vertical', [slide?.gridAxisYLabel]);

  const axisRange = useMemo(() => {
    return {
      min: slide?.gridAxisRange?.min ?? 0,
      max: slide?.gridAxisRange?.max ?? 10
    };
  }, [slide?.gridAxisRange?.min, slide?.gridAxisRange?.max]);

  const [positions, setPositions] = useState(() => {
    const initial = {};
    const minVal = slide?.gridAxisRange?.min ?? 0;
    items.forEach((item) => {
      initial[item.id] = { x: minVal, y: minVal };
    });
    return initial;
  });

  const [touched, setTouched] = useState(() => {
    const initial = {};
    items.forEach((item) => {
      initial[item.id] = { x: false, y: false };
    });
    return initial;
  });

  useEffect(() => {
    const initial = {};
    const touchedInitial = {};
    const minVal = slide?.gridAxisRange?.min ?? 0;
    items.forEach((item) => {
      initial[item.id] = { x: minVal, y: minVal };
      touchedInitial[item.id] = { x: false, y: false };
    });
    setPositions(initial);
    setTouched(touchedInitial);
  }, [slide?.id, items, slide?.gridAxisRange?.min]);

  const handleSliderChange = (itemId, axis, value) => {
    if (hasSubmitted) return;
    
    setPositions((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [axis]: Number(value)
      }
    }));
    
    setTouched((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [axis]: true
      }
    }));
  };

  const handleSubmit = async () => {
    if (hasSubmitted) return;
    
    // Check if all sliders have been touched
    const allTouched = items.every(item => 
      touched[item.id]?.x && touched[item.id]?.y
    );
    
    if (!allTouched) return;
    
    // Store actual axis values (no normalization)
    const positionArray = items.map(item => {
      const xValue = positions[item.id]?.x ?? axisRange.min;
      const yValue = positions[item.id]?.y ?? axisRange.min;
      
      return {
        item: item.id,
        x: xValue,
        y: yValue
      };
    });
    
    await onSubmit(positionArray);
  };

  const allTouched = items.every(item => 
    touched[item.id]?.x && touched[item.id]?.y
  );

  if (!slide) return null;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 sm:space-y-6 py-2 sm:py-4 px-2 sm:px-4">
      <div className="text-left">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#E0E0E0] mb-4 sm:mb-6 md:mb-8 px-2">
          {typeof slide.question === 'string' 
            ? slide.question 
            : (slide.question?.text || slide.question?.label || '')}
        </h2>
      </div>

      {hasSubmitted ? (
        <div className="space-y-4 sm:space-y-6">
          {/* Submission confirmation */}
          <div className="rounded-2xl sm:rounded-3xl border border-[#4CAF50]/30 bg-[#1D2A20] px-4 sm:px-6 md:px-8 py-8 sm:py-10 md:py-12 text-center shadow-lg">
            <div className="mx-auto mb-3 sm:mb-4 flex h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 items-center justify-center rounded-full bg-[#2E7D32]/20">
              <svg className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-[#4CAF50]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-[#E0E0E0]">Positions submitted</h3>
            <p className="mt-2 text-xs sm:text-sm text-[#B0B0B0] px-2">Thanks for sharing your input. Viewing live results...</p>
          </div>

          {/* Live Results */}
          {gridResults.length > 0 && totalResponses > 0 && (
            <div className="rounded-2xl sm:rounded-3xl border border-[#2A2A2A] bg-[#1F1F1F] p-4 sm:p-5 md:p-6 lg:p-8 shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-[#E0E0E0]">Live Results</h3>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-[#9E9E9E]">
                  <div className="w-2 h-2 rounded-full bg-[#4CAF50] animate-pulse"></div>
                  <span>{totalResponses} {totalResponses === 1 ? 'response' : 'responses'}</span>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {items.map((item) => {
                  const result = gridResults.find(r => r.itemId === item.id);
                  if (!result) return null;
                  
                  const avgX = result.averageX || axisRange.min;
                  const avgY = result.averageY || axisRange.min;
                  
                  return (
                    <div key={item.id} className="bg-[#2A2A2A] rounded-lg sm:rounded-xl border border-[#2F2F2F] p-3 sm:p-4">
                      <h4 className="text-sm sm:text-base md:text-lg font-semibold text-[#E0E0E0] mb-2 sm:mb-3">
                        {typeof item.label === 'string' 
                          ? item.label 
                          : (item.text || item.label?.text || item.label?.label || '')}
                      </h4>
                      <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                        <div>
                          <div className="text-[#6C6C6C] mb-1">{axisXLabel}</div>
                          <div className="text-base sm:text-lg font-bold text-[#4CAF50]">{avgX.toFixed(1)}</div>
                        </div>
                        <div>
                          <div className="text-[#6C6C6C] mb-1">{axisYLabel}</div>
                          <div className="text-base sm:text-lg font-bold text-[#4CAF50]">{avgY.toFixed(1)}</div>
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
        <div className="space-y-4 sm:space-y-6 md:space-y-8">
          {items.map((item) => (
            <div key={item.id} className="bg-[#1F1F1F] rounded-xl sm:rounded-2xl border border-[#2A2A2A] p-4 sm:p-5 md:p-6 shadow-sm">
              <h3 className="text-base sm:text-lg font-semibold text-[#E0E0E0] mb-3 sm:mb-4">
                {typeof item.label === 'string' 
                  ? item.label 
                  : (item.text || item.label?.text || item.label?.label || '')}
              </h3>
              
              <div className="space-y-6">
                {/* X-axis slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-[#E0E0E0]">
                      {axisXLabel}
                    </label>
                    <span className="text-sm font-semibold text-[#4CAF50]">
                      {touched[item.id]?.x ? positions[item.id]?.x : '-'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={axisRange.min}
                    max={axisRange.max}
                    step="1"
                    value={positions[item.id]?.x ?? axisRange.min}
                    onChange={(e) => handleSliderChange(item.id, 'x', e.target.value)}
                    disabled={hasSubmitted}
                    className="w-full h-2 bg-[#2A2A2A] rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #4CAF50 0%, #4CAF50 ${((positions[item.id]?.x - axisRange.min) / (axisRange.max - axisRange.min)) * 100}%, #2A2A2A ${((positions[item.id]?.x - axisRange.min) / (axisRange.max - axisRange.min)) * 100}%, #2A2A2A 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-[#6C6C6C]">
                    <span>{axisRange.min}</span>
                    <span>{axisRange.max}</span>
                  </div>
                </div>

                {/* Y-axis slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-[#E0E0E0]">
                      {axisYLabel}
                    </label>
                    <span className="text-sm font-semibold text-[#4CAF50]">
                      {touched[item.id]?.y ? positions[item.id]?.y : '-'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={axisRange.min}
                    max={axisRange.max}
                    step="1"
                    value={positions[item.id]?.y ?? axisRange.min}
                    onChange={(e) => handleSliderChange(item.id, 'y', e.target.value)}
                    disabled={hasSubmitted}
                    className="w-full h-2 bg-[#2A2A2A] rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #4CAF50 0%, #4CAF50 ${((positions[item.id]?.y - axisRange.min) / (axisRange.max - axisRange.min)) * 100}%, #2A2A2A ${((positions[item.id]?.y - axisRange.min) / (axisRange.max - axisRange.min)) * 100}%, #2A2A2A 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-[#6C6C6C]">
                    <span>{axisRange.min}</span>
                    <span>{axisRange.max}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-center pt-2 sm:pt-4">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!allTouched || hasSubmitted}
              className="mt-4 sm:mt-6 flex items-center gap-2 rounded-full bg-gradient-to-r from-[#388E3C] to-[#2E7D32] hover:from-[#4CAF50] hover:to-[#388E3C] disabled:from-[#1F1F1F] disabled:to-[#1F1F1F] disabled:text-[#6C6C6C] px-6 sm:px-8 py-2.5 sm:py-3 text-base sm:text-lg font-semibold text-white transition-all active:scale-95 disabled:active:scale-100 shadow-lg shadow-[#4CAF50]/20 disabled:shadow-none disabled:cursor-not-allowed touch-manipulation"
            >
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
              Submit Response
            </button>
          </div>
        </div>
      )}

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          background: #1F1F1F;
          border: 3px solid #4CAF50;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: #1F1F1F;
          border: 3px solid #4CAF50;
          border-radius: 50%;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
};

export default TwoByTwoGridParticipantInput;
