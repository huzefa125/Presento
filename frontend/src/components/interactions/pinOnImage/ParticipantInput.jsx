import { useState, useRef, useEffect } from 'react';
import { MapPin, Send, CheckCircle, XCircle } from 'lucide-react';

const PinOnImageParticipantInput = ({ 
  slide, 
  onSubmit, 
  hasSubmitted,
  pinResults = [],
  totalResponses = 0
}) => {
  const [pin, setPin] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  const imageUrl = slide?.pinOnImageSettings?.imageUrl;
  const correctArea = slide?.pinOnImageSettings?.correctArea;

  useEffect(() => {
    // Reset pin when slide changes
    setPin(null);
  }, [slide?.id]);

  // Helper function to get coordinates relative to the actual image (accounting for object-contain)
  const getImageCoordinates = (clientX, clientY) => {
    if (!imageRef.current || !imageRef.current.complete || imageRef.current.naturalWidth === 0) {
      return { x: 0, y: 0 };
    }
    
    const rect = imageRef.current.getBoundingClientRect();
    const img = imageRef.current;
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    
    if (naturalWidth === 0 || naturalHeight === 0) {
      return { x: 0, y: 0 };
    }
    
    // Calculate the actual displayed image dimensions (accounting for object-contain)
    const displayedWidth = rect.width;
    const displayedHeight = rect.height;
    const imageAspect = naturalWidth / naturalHeight;
    const containerAspect = displayedWidth / displayedHeight;
    
    let actualImageWidth, actualImageHeight, offsetX, offsetY;
    
    if (imageAspect > containerAspect) {
      // Image is constrained by width
      actualImageWidth = displayedWidth;
      actualImageHeight = displayedWidth / imageAspect;
      offsetX = 0;
      offsetY = (displayedHeight - actualImageHeight) / 2;
    } else {
      // Image is constrained by height
      actualImageWidth = displayedHeight * imageAspect;
      actualImageHeight = displayedHeight;
      offsetX = (displayedWidth - actualImageWidth) / 2;
      offsetY = 0;
    }
    
    // Calculate relative position within the actual image
    const relativeX = (clientX - rect.left - offsetX) / actualImageWidth;
    const relativeY = (clientY - rect.top - offsetY) / actualImageHeight;
    
    // Convert to percentage and clamp
    const x = Math.max(0, Math.min(100, relativeX * 100));
    const y = Math.max(0, Math.min(100, relativeY * 100));
    
    return { x, y };
  };

  const handleImageClick = (e) => {
    if (hasSubmitted) return;

    const coords = getImageCoordinates(e.clientX, e.clientY);
    setPin(coords);
  };

  // Check if pin is within correct area
  const checkIfCorrect = (pinCoords) => {
    if (!correctArea || !pinCoords) return null;
    
    const { x, y, width, height } = correctArea;
    const pinX = pinCoords.x;
    const pinY = pinCoords.y;
    
    // Check if pin is within the correct area rectangle
    const isInArea = (
      pinX >= x &&
      pinX <= (x + width) &&
      pinY >= y &&
      pinY <= (y + height)
    );
    
    return isInArea;
  };

  const handleSubmit = async () => {
    if (!pin) return;
    
    // Check if correct before submitting
    const correct = checkIfCorrect(pin);
    setIsCorrect(correct);
    
    await onSubmit(pin);
  };

  // Update correctness when pin changes
  useEffect(() => {
    if (pin && correctArea) {
      setIsCorrect(checkIfCorrect(pin));
    } else {
      setIsCorrect(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, correctArea]);

  if (!imageUrl) {
    return (
      <div className="flex items-center justify-center py-16 text-[#6C6C6C]">
        <p className="text-sm">No image configured</p>
      </div>
    );
  }

  const canSubmit = pin && !hasSubmitted;

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4">
      <div className="rounded-2xl sm:rounded-3xl border border-[#2A2A2A] bg-[#1F1F1F] shadow-sm p-4 sm:p-6 md:p-8">
        {/* Question */}
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[#E0E0E0] text-center mb-4 sm:mb-6 px-2">
          {typeof slide?.question === 'string' 
            ? slide.question 
            : (slide.question?.text || slide.question?.label || 'Place your pin on the image')}
        </h2>

        {/* Instructions */}
        <p className="text-xs sm:text-sm text-[#B0B0B0] text-center mb-4 sm:mb-6 px-2">
          {hasSubmitted 
            ? (isCorrect !== null 
                ? (isCorrect 
                    ? '✓ Correct! Your pin is in the correct area' 
                    : '✗ Incorrect. Your pin is not in the correct area')
                  : '✓ Your response has been submitted')
            : 'Click on the image to place your pin'
          }
        </p>

        {/* Image Container */}
        <div 
          ref={containerRef}
          className="relative w-full rounded-lg sm:rounded-xl overflow-hidden border-2 border-[#2A2A2A] bg-[#1F1F1F] mb-4 sm:mb-6"
          style={{ maxHeight: '500px' }}
        >
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Pin placement"
            onClick={handleImageClick}
            className={`w-full h-auto object-contain max-h-[300px] sm:max-h-[500px] ${!hasSubmitted && 'cursor-crosshair touch-manipulation'}`}
            draggable={false}
          />

          {/* Render Pin */}
          {pin && (() => {
            // Calculate pin position accounting for object-contain
            if (!imageRef.current || !imageRef.current.complete) return null;
            
            const img = imageRef.current;
            const rect = img.getBoundingClientRect();
            const naturalWidth = img.naturalWidth;
            const naturalHeight = img.naturalHeight;
            
            if (naturalWidth === 0 || naturalHeight === 0) return null;
            
            const imageAspect = naturalWidth / naturalHeight;
            const containerAspect = rect.width / rect.height;
            
            let actualImageWidth, actualImageHeight, offsetX, offsetY;
            
            if (imageAspect > containerAspect) {
              actualImageWidth = rect.width;
              actualImageHeight = rect.width / imageAspect;
              offsetX = 0;
              offsetY = (rect.height - actualImageHeight) / 2;
            } else {
              actualImageWidth = rect.height * imageAspect;
              actualImageHeight = rect.height;
              offsetX = (rect.width - actualImageWidth) / 2;
              offsetY = 0;
            }
            
            const pinX = offsetX + (pin.x / 100) * actualImageWidth;
            const pinY = offsetY + (pin.y / 100) * actualImageHeight;
            
            return (
              <div
                className="absolute transform -translate-x-1/2 -translate-y-full animate-bounce-in"
                style={{
                  left: `${pinX}px`,
                  top: `${pinY}px`,
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!hasSubmitted) {
                      setPin(null);
                      setIsCorrect(null);
                    }
                  }}
                  disabled={hasSubmitted}
                  className={`relative ${!hasSubmitted && 'hover:scale-110'} transition-transform`}
                  title={hasSubmitted ? '' : 'Click to remove'}
                >
                  <MapPin 
                    className={`w-8 h-8 drop-shadow-lg ${
                      isCorrect === true 
                        ? 'text-[#4CAF50]' 
                        : isCorrect === false 
                          ? 'text-[#EF5350]' 
                          : 'text-[#4CAF50]'
                    }`}
                    fill="currentColor"
                  />
                </button>
              </div>
            );
          })()}
          
          {/* Render Correct Area Overlay */}
          {correctArea && imageRef.current && imageRef.current.complete && (() => {
            const img = imageRef.current;
            const rect = img.getBoundingClientRect();
            const naturalWidth = img.naturalWidth;
            const naturalHeight = img.naturalHeight;
            
            if (naturalWidth === 0 || naturalHeight === 0) return null;
            
            const imageAspect = naturalWidth / naturalHeight;
            const containerAspect = rect.width / rect.height;
            
            let actualImageWidth, actualImageHeight, offsetX, offsetY;
            
            if (imageAspect > containerAspect) {
              actualImageWidth = rect.width;
              actualImageHeight = rect.width / imageAspect;
              offsetX = 0;
              offsetY = (rect.height - actualImageHeight) / 2;
            } else {
              actualImageWidth = rect.height * imageAspect;
              actualImageHeight = rect.height;
              offsetX = (rect.width - actualImageWidth) / 2;
              offsetY = 0;
            }
            
            return (
              <div
                className="absolute border-2 border-[#4CAF50] bg-[#4CAF50]/10 pointer-events-none"
                style={{
                  left: `${offsetX + (correctArea.x / 100) * actualImageWidth}px`,
                  top: `${offsetY + (correctArea.y / 100) * actualImageHeight}px`,
                  width: `${(correctArea.width / 100) * actualImageWidth}px`,
                  height: `${(correctArea.height / 100) * actualImageHeight}px`,
                }}
              />
            );
          })()}
        </div>

        {/* Pin Status */}
        {pin && !hasSubmitted && (
          <div className="text-center text-sm mb-4">
            {isCorrect === true && (
              <div className="flex items-center justify-center gap-2 text-[#4CAF50]">
                <CheckCircle className="w-4 h-4" />
                <span>Pin is in the correct area!</span>
              </div>
            )}
            {isCorrect === false && (
              <div className="flex items-center justify-center gap-2 text-[#EF5350]">
                <XCircle className="w-4 h-4" />
                <span>Pin is not in the correct area</span>
              </div>
            )}
            {isCorrect === null && (
              <span className="text-[#B0B0B0]">Pin placed</span>
            )}
          </div>
        )}
        
        {/* Submission Result */}
        {hasSubmitted && isCorrect !== null && (
          <div className={`rounded-xl p-4 mb-4 text-center ${
            isCorrect
              ? 'bg-[#1D2A20] border border-[#4CAF50]/30'
              : 'bg-[#2A1F1F] border border-[#EF5350]/30'
          }`}>
            {isCorrect ? (
              <div className="flex items-center justify-center gap-2 text-[#4CAF50]">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">Correct! Your pin is in the correct area.</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-[#EF5350]">
                <XCircle className="w-5 h-5" />
                <span className="font-semibold">Incorrect. Your pin is not in the correct area.</span>
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        {!hasSubmitted && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`
                inline-flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-medium text-sm sm:text-base
                transition-all duration-200 transform touch-manipulation
                ${canSubmit
                  ? 'bg-gradient-to-r from-[#388E3C] to-[#2E7D32] hover:from-[#4CAF50] hover:to-[#388E3C] text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
                  : 'bg-[#2A2A2A] text-[#6C6C6C] cursor-not-allowed'
                }
              `}
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              Submit
            </button>
          </div>
        )}

        {/* Live Results */}
        {hasSubmitted && totalResponses > 0 && (
          <div className="mt-6 bg-[#1F1F1F] rounded-xl border border-[#2A2A2A] p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#E0E0E0]">Live Pin Results</h3>
              <div className="flex items-center gap-2 text-sm text-[#9E9E9E]">
                <div className="w-2 h-2 rounded-full bg-[#4CAF50] animate-pulse"></div>
                <span>{totalResponses} {totalResponses === 1 ? 'pin' : 'pins'}</span>
              </div>
            </div>
            <p className="text-sm text-[#B0B0B0]">
              {pinResults.length} pin{pinResults.length !== 1 ? 's' : ''} placed on the image. Check the presenter view for the heatmap.
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes bounce-in {
          0% {
            transform: translateX(-50%) translateY(-100%) scale(0);
          }
          50% {
            transform: translateX(-50%) translateY(-100%) scale(1.2);
          }
          100% {
            transform: translateX(-50%) translateY(-100%) scale(1);
          }
        }
        .animate-bounce-in {
          animation: bounce-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default PinOnImageParticipantInput;
