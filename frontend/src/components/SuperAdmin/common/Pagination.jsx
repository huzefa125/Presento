import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const Pagination = ({ 
  pagination, 
  onPageChange, 
  onLimitChange,
  showLimitSelector = true,
  limitOptions = [10, 25, 50, 100]
}) => {
  if (!pagination || pagination.pages <= 1) {
    return null;
  }

  const { page, pages, total, limit } = pagination;
  const startItem = ((page - 1) * limit) + 1;
  const endItem = Math.min(page * limit, total);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const delta = 2; // Number of pages to show on each side of current page
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, page - delta); i <= Math.min(pages - 1, page + delta); i++) {
      range.push(i);
    }

    if (page - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (page + delta < pages - 1) {
      rangeWithDots.push('...', pages);
    } else if (pages > 1) {
      rangeWithDots.push(pages);
    }

    return rangeWithDots;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-hairline">
      {/* Results Info */}
      <div className="text-sm text-ink-muted">
        Showing <span className="font-medium text-ink">{startItem}</span> to{' '}
        <span className="font-medium text-ink">{endItem}</span> of{' '}
        <span className="font-medium text-ink">{total}</span> results
      </div>

      <div className="flex items-center gap-4">
        {/* Page Size Selector */}
        {showLimitSelector && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-ink-muted">Show:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange && onLimitChange(parseInt(e.target.value))}
              className="px-3 py-1.5 bg-surface border border-[#dddddd] rounded-xs text-ink text-sm outline-none transition-shadow duration-150 focus:shadow-[var(--shadow-level-1)] focus:border-primary"
            >
              {limitOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        )}

        {/* Pagination Controls */}
        <div className="flex items-center gap-1">
          {/* First Page */}
          <button
            onClick={() => onPageChange(1)}
            disabled={page === 1}
            className="p-2 rounded-md border border-hairline text-ink-muted hover:bg-canvas-soft disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="First page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* Previous Page */}
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="p-2 rounded-md border border-hairline text-ink-muted hover:bg-canvas-soft disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {pageNumbers.map((pageNum, index) => {
              if (pageNum === '...') {
                return (
                  <span key={`dots-${index}`} className="px-2 text-ink-faint">
                    ...
                  </span>
                );
              }

              const isActive = pageNum === page;
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`
                    min-w-[36px] px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                    ${isActive
                      ? 'bg-primary text-on-primary'
                      : 'border border-hairline text-ink-secondary hover:bg-canvas-soft'
                    }
                  `}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          {/* Next Page */}
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === pages}
            className="p-2 rounded-md border border-hairline text-ink-muted hover:bg-canvas-soft disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Last Page */}
          <button
            onClick={() => onPageChange(pages)}
            disabled={page === pages}
            className="p-2 rounded-md border border-hairline text-ink-muted hover:bg-canvas-soft disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Last page"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;

