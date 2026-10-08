import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Paginated PDF slide preview (presenter/participant canvas). Split out of
 * SlideCanvas.jsx; see CODE_STANDARDS.md. Takes `t` as a prop rather than
 * calling useTranslation() itself, matching its original call sites.
 */
const PdfCanvasPreview = ({ slide, question, t, pages, titleKey = 'slide_editors.pdf.pdf_slide', emptyMessageKey = 'slide_editors.pdf.upload_pdf_first' }) => {
  const pdfPages = pages || slide?.pdfPages || [];
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  // Reset image error when page changes
  useEffect(() => {
    setImageError(false);
  }, [currentPageIndex]);

  if (!pdfPages || pdfPages.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="rounded-xl border border-hairline bg-surface shadow-[var(--shadow-level-2)] p-4 sm:p-6 lg:p-8">
          <div className="border-b border-hairline px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8 lg:pt-10 pb-4 sm:pb-6">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-ink text-center">
              {t(titleKey)}
            </h2>
          </div>
          <div className="px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-10">
            <div className="rounded-xl border-2 border-dashed border-ink-faint bg-canvas-soft py-12 sm:py-16 text-center">
              <p className="text-ink-muted">{t(emptyMessageKey)}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentPage = pdfPages[currentPageIndex];
  const totalPages = pdfPages.length;

  const goToPreviousPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPageIndex < totalPages - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="rounded-xl border border-hairline bg-surface shadow-[var(--shadow-level-2)] p-4 sm:p-6 lg:p-8">
        <div className="border-b border-hairline px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8 lg:pt-10 pb-4 sm:pb-6 mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-ink text-center">
            {t(titleKey)}
          </h2>
        </div>

        {/* Page Display */}
        <div className="rounded-xl overflow-hidden border border-hairline bg-canvas-soft mb-4">
          <div className="flex items-center justify-center min-h-[400px] max-h-[70vh] p-4">
            {currentPage?.imageUrl ? (
              <img
                src={currentPage.imageUrl}
                alt={`Page ${currentPage.pageNumber}`}
                className="max-w-full max-h-full object-contain rounded-lg"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div className="hidden items-center justify-center text-ink-muted">
              <p>{t('slide_editors.pdf.image_load_error')}</p>
            </div>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="bg-canvas-soft rounded-lg border border-hairline p-3 sm:p-4 flex items-center justify-between">
          <button
            onClick={goToPreviousPage}
            disabled={currentPageIndex === 0}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm ${
              currentPageIndex === 0
                ? 'bg-canvas-soft text-ink-faint cursor-not-allowed'
                : 'bg-accent-green hover:bg-accent-green/80 text-white'
            }`}
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">{t('slide_editors.pdf.previous')}</span>
          </button>

          <div className="text-ink text-xs sm:text-sm font-medium">
            {t('slide_editors.pdf.page')} {currentPageIndex + 1} / {totalPages}
          </div>

          <button
            onClick={goToNextPage}
            disabled={currentPageIndex === totalPages - 1}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm ${
              currentPageIndex === totalPages - 1
                ? 'bg-canvas-soft text-ink-faint cursor-not-allowed'
                : 'bg-accent-green hover:bg-accent-green/80 text-white'
            }`}
          >
            <span className="hidden sm:inline">{t('slide_editors.pdf.next')}</span>
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PdfCanvasPreview;
