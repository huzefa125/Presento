import { useState, useRef, useEffect } from 'react';
import { Check, X } from 'lucide-react';

const AreaSelector = ({ imageUrl, onSave, onCancel, initialArea }) => {
  const [selection, setSelection] = useState(initialArea || null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const imageRef = useRef(null);
  const containerRef = useRef(null);

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
    
    // Convert to percentage
    const x = Math.max(0, Math.min(100, relativeX * 100));
    const y = Math.max(0, Math.min(100, relativeY * 100));
    
    return { x, y };
  };

  const handleMouseDown = (e) => {
    if (!imageRef.current) return;
    
    const coords = getImageCoordinates(e.clientX, e.clientY);
    setStartPoint(coords);
    setIsSelecting(true);
  };

  const handleMouseMove = (e) => {
    if (!isSelecting || !startPoint || !imageRef.current) return;
    
    const coords = getImageCoordinates(e.clientX, e.clientY);
    
    const x = Math.min(startPoint.x, coords.x);
    const y = Math.min(startPoint.y, coords.y);
    const width = Math.abs(coords.x - startPoint.x);
    const height = Math.abs(coords.y - startPoint.y);
    
    setSelection({ x, y, width, height });
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
    setStartPoint(null);
  };

  useEffect(() => {
    if (isSelecting) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
    // eslint-disable-next-line
  }, [isSelecting, startPoint]);

  const handleSave = () => {
    if (selection) {
      onSave(selection);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-[#232323] text-[#E0E0E0] rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col border border-[#2F2F2F]">
        {/* Header */}
        <div className="p-4 border-b border-[#2A2A2A] flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#E0E0E0]">Select Correct Area</h3>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-[#2A2A2A] rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          <p className="text-sm text-[#B0B0B0] mb-4">
            Click and drag to select the correct area on the image. Participants who click inside this area will be marked as correct.
          </p>
          
          <div 
            ref={containerRef}
            className="relative w-full max-w-4xl mx-auto"
          >
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Select area"
              className="w-full h-auto cursor-crosshair select-none object-contain"
              style={{ maxHeight: '60vh' }}
              onMouseDown={handleMouseDown}
              draggable={false}
            />
            
            {/* Selection overlay - positioned relative to the actual image */}
            {selection && imageRef.current && imageRef.current.complete && (() => {
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
                  className="absolute border-2 border-[#4FC3F7] bg-[#4FC3F7]/25"
                  style={{
                    left: `${offsetX + (selection.x / 100) * actualImageWidth}px`,
                    top: `${offsetY + (selection.y / 100) * actualImageHeight}px`,
                    width: `${(selection.width / 100) * actualImageWidth}px`,
                    height: `${(selection.height / 100) * actualImageHeight}px`,
                    pointerEvents: 'none'
                  }}
                >
                </div>
              );
            })()}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#2A2A2A] flex items-center justify-between">
          <button
            onClick={() => setSelection(null)}
            className="px-4 py-2 text-sm text-[#E0E0E0] hover:bg-[#2A2A2A] rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={!selection}
          >
            Clear Selection
          </button>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-[#E0E0E0] hover:bg-[#2A2A2A] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!selection}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#388E3C] hover:bg-[#2E7D32] disabled:bg-[#555555] text-white rounded-lg transition-colors text-sm font-medium"
            >
              <Check className="w-4 h-4" />
              Save Area
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AreaSelector;
