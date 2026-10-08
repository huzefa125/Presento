import { useEffect, useState } from 'react';

/**
 * Positions the "correct area" highlight overlay on a pin-on-image slide,
 * accounting for object-contain letterboxing on the underlying image. Split
 * out of SlideCanvas.jsx; see CODE_STANDARDS.md.
 */
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
      className="absolute border-2 border-accent-green bg-accent-green/10 pointer-events-none"
      style={overlayStyle}
    />
  );
};

export default CorrectAreaOverlay;
