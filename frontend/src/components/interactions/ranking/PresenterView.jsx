import { useMemo } from 'react';
// eslint-disable-next-line
import { motion, AnimatePresence } from 'framer-motion';
import { Users } from 'lucide-react';

const RankingPresenterView = ({
  slide,
  rankingResults = [],
  totalResponses = 0
}) => {
  const hasResponses = totalResponses > 0 && Array.isArray(rankingResults) && rankingResults.length > 0;

  const items = useMemo(() => {
    if (!hasResponses) {
      return [];
    }

    return rankingResults.map((item, index) => ({
      id: item.id || index,
      label: item.label || `Item ${index + 1}`,
      score: item.score || 0,
      averagePosition: item.averagePosition,
      responseCount: item.responseCount || 0
    }));
  }, [hasResponses, rankingResults]);

  // Fixed bar widths based on rank position (Mentimeter style)
  const getBarWidth = (index, totalItems) => {
    if (totalItems === 0) return 0;
    // First place gets 100%, each subsequent rank gets progressively smaller
    const decrement = 100 / (totalItems + 1);
    return Math.max(100 - (index * decrement), 20);
  };

  // Color palette for different ranks (decorative sticker palette)
  const getBarColor = (index) => {
    const colors = [
      'bg-accent-sky',
      'bg-accent-purple-deep',
      'bg-accent-pink',
      'bg-accent-orange',
      'bg-accent-teal',
      'bg-accent-green',
      'bg-accent-brown',
      'bg-accent-purple',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="rounded-2xl sm:rounded-3xl border border-hairline bg-surface p-6 sm:p-10 shadow-[var(--shadow-level-2)]">
        <div className="flex flex-col gap-4 sm:gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-ink">{slide?.question || 'Ranking results'}</h2>
            <div className="flex items-center gap-2 rounded-full bg-canvas-soft border border-primary/30 px-4 py-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">{totalResponses} response{totalResponses === 1 ? '' : 's'}</span>
            </div>
          </div>

          <div className="space-y-4 mt-4">
            {items.length === 0 ? (
              <div className="flex items-center justify-center py-12 sm:py-16 text-ink-faint">
                <p className="text-base sm:text-lg">Waiting for responses...</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{
                      layout: { duration: 0.4, ease: 'easeInOut' },
                      opacity: { duration: 0.2 }
                    }}
                    className="flex items-center gap-3 sm:gap-4"
                  >
                    <div className="flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-lg bg-canvas-soft text-lg sm:text-xl font-bold text-ink">
                      {index + 1}.
                    </div>

                    <div className="flex-1">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-lg sm:text-xl font-semibold text-ink">{item.label}</span>
                      </div>
                      <div className="relative group">
                        <motion.div
                          className={`h-10 sm:h-12 rounded-lg ${getBarColor(index)} shadow-[var(--shadow-level-1)]`}
                          initial={{ width: 0 }}
                          animate={{ width: `${getBarWidth(index, items.length)}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                        <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-semibold text-ink opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                          Score: {item.score}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  )};

export default RankingPresenterView;
