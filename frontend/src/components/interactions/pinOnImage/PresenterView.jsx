import { useRef, useEffect, useState } from 'react';
import { MapPin, Users } from 'lucide-react';

// Helper component to position the correct area overlay accounting for object-contain letterboxing
const CorrectAreaOverlay = ({ correctArea, imageRef }) => {
  const [overlayStyle, setOverlayStyle] = useState(null);

  useEffect(() => {
    const updateOverlayPosition = () => {
      if (!imageRef.current || !imageRef.current.complete) {
        setOverlayStyle(null);
        return;
      }

      const img = imageRef.current;
      const rect = img.getBoundingClientRect();
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;

      if (naturalWidth === 0 || naturalHeight === 0) {
        setOverlayStyle(null);
        return;
      }

      // Calculate the actual displayed image dimensions (accounting for object-contain)
      const imageAspect = naturalWidth / naturalHeight;
      const containerAspect = rect.width / rect.height;

      let actualImageWidth, actualImageHeight, offsetX, offsetY;

      if (imageAspect > containerAspect) {
        // Image is constrained by width
        actualImageWidth = rect.width;
        actualImageHeight = rect.width / imageAspect;
        offsetX = 0;
        offsetY = (rect.height - actualImageHeight) / 2;
      } else {
        // Image is constrained by height
        actualImageWidth = rect.height * imageAspect;
        actualImageHeight = rect.height;
        offsetX = (rect.width - actualImageWidth) / 2;
        offsetY = 0;
      }

      // Position overlay relative to the actual image area
      setOverlayStyle({
        left: `${offsetX + (correctArea.x / 100) * actualImageWidth}px`,
        top: `${offsetY + (correctArea.y / 100) * actualImageHeight}px`,
        width: `${(correctArea.width / 100) * actualImageWidth}px`,
        height: `${(correctArea.height / 100) * actualImageHeight}px`,
      });
    };

    updateOverlayPosition();

    // Update on window resize
    window.addEventListener('resize', updateOverlayPosition);
    // Update when image loads
    if (imageRef.current) {
      imageRef.current.addEventListener('load', updateOverlayPosition);
    }

    return () => {
      window.removeEventListener('resize', updateOverlayPosition);
      if (imageRef.current) {
        imageRef.current.removeEventListener('load', updateOverlayPosition);
      }
    };
  }, [correctArea, imageRef]);

  if (!overlayStyle) return null;

  return (
    <div
      className="absolute border-2 border-[#4CAF50] bg-[#4CAF50]/10 pointer-events-none z-10"
      style={overlayStyle}
    />
  );
};

const PinOnImagePresenterView = ({ slide, pinResults = [], totalResponses = 0 }) => {
  const imageRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const imageUrl = slide?.pinOnImageSettings?.imageUrl;
  const correctArea = slide?.pinOnImageSettings?.correctArea;
  const hasResponses = totalResponses > 0 && Array.isArray(pinResults) && pinResults.length > 0;
  
  // Helper to calculate pin position accounting for object-contain
  const getPinPosition = (pin) => {
    if (!imageRef.current || !imageRef.current.complete) return { x: 0, y: 0 };
    
    const img = imageRef.current;
    const rect = img.getBoundingClientRect();
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    
    if (naturalWidth === 0 || naturalHeight === 0) return { x: 0, y: 0 };
    
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
    
    return {
      x: offsetX + (pin.x / 100) * actualImageWidth,
      y: offsetY + (pin.y / 100) * actualImageHeight
    };
  };

  useEffect(() => {
    setImageLoaded(false);
  }, [imageUrl]);

  if (!imageUrl) {
    return (
      <div className="flex items-center justify-center py-16 text-[#6C6C6C]">
        <p className="text-sm">No image configured</p>
      </div>
    );
  }

  // Check if pin is in correct area
  const isPinInCorrectArea = (pin) => {
    if (!correctArea || !pin) return false;
    
    const { x, y, width, height } = correctArea;
    const pinX = pin.x;
    const pinY = pin.y;
    
    return (
      pinX >= x &&
      pinX <= (x + width) &&
      pinY >= y &&
      pinY <= (y + height)
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-2xl sm:rounded-3xl border border-[#2A2A2A] bg-[#1F1F1F] p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col gap-4 sm:gap-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#E0E0E0]">
              {slide?.question || 'Pin on Image Results'}
            </h2>
            <div className="flex items-center gap-2 rounded-full bg-[#1D2A20] border border-[#2E7D32]/30 px-4 py-2">
              <Users className="h-4 w-4 text-[#4CAF50]" />
              <span className="text-sm font-medium text-[#4CAF50]">
                {totalResponses} response{totalResponses === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          {/* Image with Pins */}
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 items-start">
            <div className="flex-1 w-full">
              {!hasResponses ? (
                <div className="flex items-center justify-center py-24 sm:py-32 text-[#6C6C6C] bg-[#2A2A2A] rounded-xl border-2 border-dashed border-[#2F2F2F]">
                  <div className="text-center">
                    <MapPin className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-50 text-[#4CAF50]" />
                    <p className="text-sm">Waiting for responses...</p>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-[#2A2A2A] bg-[#2A2A2A]">
                  <img
                    ref={imageRef}
                    src={imageUrl}
                    alt="Pin placement results"
                    onLoad={() => setImageLoaded(true)}
                    className="w-full h-auto object-contain"
                    style={{ maxHeight: '600px' }}
                  />

                  {/* Correct Area Overlay */}
                  {correctArea && <CorrectAreaOverlay correctArea={correctArea} imageRef={imageRef} />}
                  
                  {/* Render all pins */}
                  {imageLoaded && imageRef.current && imageRef.current.complete && pinResults.map((pin, index) => {
                    const position = getPinPosition(pin);
                    const inCorrectArea = isPinInCorrectArea(pin);
                    
                    // Skip if position calculation failed
                    if (position.x === 0 && position.y === 0 && pin.x !== 0 && pin.y !== 0) {
                      return null;
                    }
                    
                    return (
                      <div
                        key={index}
                        className="absolute transform -translate-x-1/2 -translate-y-full animate-pin-drop"
                        style={{
                          left: `${position.x}px`,
                          top: `${position.y}px`,
                          animationDelay: `${index * 50}ms`
                        }}
                      >
                        <MapPin 
                          className={`w-6 h-6 drop-shadow-lg opacity-80 hover:opacity-100 transition-opacity ${
                            inCorrectArea ? 'text-[#4CAF50]' : 'text-[#EF5350]'
                          }`}
                          fill="currentColor"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Stats Panel */}
            <div className="w-full lg:w-64 flex-shrink-0">
              <div className="bg-[#2A2A2A] rounded-xl p-4 border border-[#2F2F2F]">
                <h3 className="text-sm font-semibold text-[#E0E0E0] mb-3">Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#B0B0B0]">Total Pins:</span>
                    <span className="text-lg font-bold text-[#4CAF50]">{pinResults.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#B0B0B0]">Responses:</span>
                    <span className="text-lg font-bold text-[#E0E0E0]">{totalResponses}</span>
                  </div>
                  {correctArea && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#B0B0B0]">Correct:</span>
                        <span className="text-lg font-bold text-[#4CAF50]">
                          {pinResults.filter(p => isPinInCorrectArea(p)).length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#B0B0B0]">Incorrect:</span>
                        <span className="text-lg font-bold text-[#EF5350]">
                          {pinResults.filter(p => !isPinInCorrectArea(p)).length}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Legend */}
              <div className="mt-4 bg-[#1D2A20] border border-[#2E7D32]/30 rounded-xl p-4">
                <div className="space-y-2">
                  {correctArea && (
                    <>
                      <div className="flex items-start gap-2">
                        <div className="w-4 h-4 border-2 border-[#4CAF50] bg-[#4CAF50]/10 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-[#B0B0B0]">
                          Green border shows the correct area
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-[#4CAF50] flex-shrink-0 mt-0.5" fill="currentColor" />
                        <div className="text-xs text-[#B0B0B0]">
                          Green pins are in the correct area
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-[#EF5350] flex-shrink-0 mt-0.5" fill="currentColor" />
                        <div className="text-xs text-[#B0B0B0]">
                          Red pins are outside the correct area
                        </div>
                      </div>
                    </>
                  )}
                  {!correctArea && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-5 h-5 text-[#4CAF50] flex-shrink-0 mt-0.5" fill="currentColor" />
                      <div className="text-xs text-[#B0B0B0]">
                        Each pin represents a participant's response.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pin-drop {
          0% {
            transform: translateX(-50%) translateY(-200%) scale(0);
            opacity: 0;
          }
          50% {
            transform: translateX(-50%) translateY(-100%) scale(1.2);
          }
          100% {
            transform: translateX(-50%) translateY(-100%) scale(1);
            opacity: 0.8;
          }
        }
        .animate-pin-drop {
          animation: pin-drop 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default PinOnImagePresenterView;
