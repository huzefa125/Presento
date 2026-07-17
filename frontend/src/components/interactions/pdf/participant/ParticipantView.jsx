import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PdfParticipantView = ({ slide }) => {
  const { t } = useTranslation();
  const pdfPages = slide?.pdfPages || [];
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  if (!pdfPages || pdfPages.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-canvas-soft text-ink-muted">
        <div className="text-center">
          <p className="text-lg mb-2">{t('slide_editors.pdf.no_pages')}</p>
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
    <div className="w-full h-full bg-canvas-soft flex flex-col">
      {/* PDF Page Display */}
      <div className="flex-1 flex items-center justify-center p-2 sm:p-3 md:p-4 relative overflow-auto">
        <img
          src={currentPage?.imageUrl}
          alt={`Page ${currentPage?.pageNumber}`}
          className="max-w-full max-h-full object-contain rounded-lg sm:rounded-xl shadow-[var(--shadow-level-2)]"
        />
      </div>

      {/* Navigation Controls */}
      <div className="bg-surface border-t border-hairline p-2 sm:p-3 md:p-4 flex items-center justify-between gap-2">
        <button
          onClick={goToPreviousPage}
          disabled={currentPageIndex === 0}
          className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-md border transition-colors touch-manipulation text-sm sm:text-base ${
            currentPageIndex === 0
              ? 'bg-canvas-soft border-hairline text-ink-faint cursor-not-allowed'
              : 'bg-surface border-hairline text-ink hover:bg-canvas-soft active:scale-95'
          }`}
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">{t('slide_editors.pdf.previous')}</span>
        </button>

        <div className="text-ink-secondary text-xs sm:text-sm font-medium px-2">
          {t('slide_editors.pdf.page')} {currentPageIndex + 1} / {totalPages}
        </div>

        <button
          onClick={goToNextPage}
          disabled={currentPageIndex === totalPages - 1}
          className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-md border transition-colors touch-manipulation text-sm sm:text-base ${
            currentPageIndex === totalPages - 1
              ? 'bg-canvas-soft border-hairline text-ink-faint cursor-not-allowed'
              : 'bg-surface border-hairline text-ink hover:bg-canvas-soft active:scale-95'
          }`}
        >
          <span className="hidden sm:inline">{t('slide_editors.pdf.next')}</span>
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  );
};

export default PdfParticipantView;

