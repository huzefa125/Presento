import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PowerPointPresenterView = ({ slide, responses = [] }) => {
  const powerpointUrl = slide?.powerpointUrl;
  const powerpointPages = slide?.powerpointPages || [];
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);

  const footer = (
    <div className="bg-surface border-t border-hairline p-2 sm:p-3 md:p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
        <div className="text-xs sm:text-sm text-ink-muted text-center sm:text-left">
          Participants are viewing the PowerPoint presentation
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="flex items-center">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-accent-teal rounded-full mr-1 sm:mr-2"></div>
            <span className="text-ink font-medium text-sm sm:text-base">{responses.length}</span>
            <span className="text-ink-muted ml-1 text-xs sm:text-sm">views</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Uploaded files are converted server-side to real slide images - render those directly.
  if (powerpointPages.length > 0) {
    const currentPage = powerpointPages[currentPageIndex];
    const totalPages = powerpointPages.length;

    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center p-2 sm:p-3 md:p-4 relative overflow-auto">
          <img
            src={currentPage?.imageUrl}
            alt={`Slide ${currentPage?.pageNumber}`}
            className="max-w-full max-h-full object-contain rounded-lg sm:rounded-xl shadow-[var(--shadow-level-2)]"
          />
        </div>
        <div className="bg-surface border-t border-hairline p-2 sm:p-3 md:p-4 flex items-center justify-between gap-2">
          <button
            onClick={() => setCurrentPageIndex((i) => Math.max(0, i - 1))}
            disabled={currentPageIndex === 0}
            className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-md border transition-colors touch-manipulation text-sm sm:text-base ${
              currentPageIndex === 0
                ? 'bg-canvas-soft border-hairline text-ink-faint cursor-not-allowed'
                : 'bg-surface border-hairline text-ink hover:bg-canvas-soft active:scale-95'
            }`}
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Previous</span>
          </button>
          <div className="text-ink-secondary text-xs sm:text-sm font-medium px-2">
            Slide {currentPageIndex + 1} / {totalPages}
          </div>
          <button
            onClick={() => setCurrentPageIndex((i) => Math.min(totalPages - 1, i + 1))}
            disabled={currentPageIndex === totalPages - 1}
            className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-md border transition-colors touch-manipulation text-sm sm:text-base ${
              currentPageIndex === totalPages - 1
                ? 'bg-canvas-soft border-hairline text-ink-faint cursor-not-allowed'
                : 'bg-surface border-hairline text-ink hover:bg-canvas-soft active:scale-95'
            }`}
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
        {footer}
      </div>
    );
  }

  // Fallback: a pasted external URL (Office Online / SharePoint / Google Slides / etc) with
  // no server-side conversion - embed it directly via iframe, since it's already viewer-hosted.
  const embedUrl = useMemo(() => {
    if (!powerpointUrl || !powerpointUrl.trim() || powerpointUrl.trim().startsWith('blob:')) return null;
    return powerpointUrl.trim();
  }, [powerpointUrl]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow flex flex-col items-center justify-center p-2 sm:p-3 md:p-4">
        <div className="w-full max-w-6xl px-2 sm:px-4">
          {slide?.question && (
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-ink mb-3 sm:mb-4 text-center px-2">
              {typeof slide.question === 'string'
                ? slide.question
                : (slide.question?.text || slide.question?.label || '')}
            </h2>
          )}

          {embedUrl ? (
            <div className="w-full bg-surface rounded-lg sm:rounded-xl overflow-hidden border border-hairline shadow-[var(--shadow-level-1)] relative" style={{ minHeight: '400px', height: '60vh' }}>
              {isLoading && !iframeError && (
                <div className="absolute inset-0 bg-surface flex items-center justify-center z-10">
                  <div className="text-center p-4 sm:p-6">
                    <div className="inline-block animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary mb-3 sm:mb-4"></div>
                    <p className="text-sm sm:text-base text-ink-secondary">Loading presentation...</p>
                  </div>
                </div>
              )}
              {iframeError ? (
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <div className="text-center max-w-md">
                    <p className="text-accent-orange-deep mb-2 text-base sm:text-lg font-semibold">Unable to embed presentation</p>
                    <a
                      href={powerpointUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-active text-on-primary rounded-full transition text-sm"
                    >
                      Open in new tab
                    </a>
                  </div>
                </div>
              ) : (
                <iframe
                  src={embedUrl}
                  title="PowerPoint Presentation"
                  className="w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                  onError={() => { setIframeError(true); setIsLoading(false); }}
                  onLoad={() => setTimeout(() => setIsLoading(false), 1500)}
                  style={{ minHeight: '400px', height: '100%', width: '100%', opacity: isLoading ? 0.3 : 1, transition: 'opacity 0.5s ease-in-out', border: 'none' }}
                />
              )}
            </div>
          ) : (
            <div className="aspect-video bg-surface rounded-xl overflow-hidden border border-hairline shadow-[var(--shadow-level-1)]">
              <div className="w-full h-full flex flex-col items-center justify-center bg-canvas-soft">
                <div className="text-center p-6">
                  <h3 className="text-xl font-semibold text-ink mb-2">PowerPoint Presentation</h3>
                  <p className="text-ink-muted mb-4">No presentation configured</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {footer}
    </div>
  );
};

export default PowerPointPresenterView;
