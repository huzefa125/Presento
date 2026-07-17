import { useMemo } from 'react';
// eslint-disable-next-line
import { motion, AnimatePresence } from 'framer-motion';
import { Users } from 'lucide-react';

const HundredPointsPresenterView = ({
  slide,
  hundredPointsResults = [],
  totalResponses = 0
}) => {
  const hasResponses = totalResponses > 0 && Array.isArray(hundredPointsResults) && hundredPointsResults.length > 0;

  const items = useMemo(() => {
    if (!hasResponses) {
      return [];
    }

    return hundredPointsResults.map((item, index) => ({
      id: item.id || index,
      label: item.label || `Item ${index + 1}`,
      totalPoints: item.totalPoints || 0,
      participantCount: item.participantCount || 0,
      averagePoints: item.averagePoints || 0
    }));
  }, [hasResponses, hundredPointsResults]);

  // Fixed bar widths based on rank position (Mentimeter style)
  const getBarWidth = (index, totalItems) => {
    if (totalItems === 0) return 0;
    // First place gets 100%, each subsequent rank gets progressively smaller
    const decrement = 100 / (totalItems + 1);
    return Math.max(100 - (index * decrement), 20);
  };

  // Color palette for different ranks
  const getBarColor = (index) => {
    const colors = [
      'bg-gradient-to-r from-red-400 to-red-500',
      'bg-gradient-to-r from-blue-400 to-blue-500',
      'bg-gradient-to-r from-indigo-500 to-indigo-600',
      'bg-gradient-to-r from-purple-400 to-purple-500',
      'bg-gradient-to-r from-pink-400 to-pink-500',
      'bg-gradient-to-r from-orange-400 to-orange-500',
      'bg-gradient-to-r from-yellow-400 to-yellow-500',
      'bg-gradient-to-r from-green-400 to-green-500',
      'bg-gradient-to-r from-teal-400 to-teal-500',
      'bg-gradient-to-r from-cyan-400 to-cyan-500',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="rounded-2xl sm:rounded-3xl border border-[#2A2A2A] bg-[#1F1F1F] p-6 sm:p-10 shadow-xl">
        <div className="flex flex-col gap-4 sm:gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#E0E0E0]">{slide?.question || '100 Points results'}</h2>
            <div className="flex items-center gap-2 rounded-full bg-[#1D2A20] border border-[#2E7D32]/30 px-4 py-2">
              <Users className="h-4 w-4 text-[#4CAF50]" />
              <span className="text-sm font-medium text-[#4CAF50]">{totalResponses} response{totalResponses === 1 ? '' : 's'}</span>
            </div>
          </div>

          <div className="space-y-4 mt-4">
            {items.length === 0 ? (
              <div className="flex items-center justify-center py-12 sm:py-16 text-[#6C6C6C]">
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
                    <div className="flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-lg bg-[#2A2A2A] text-lg sm:text-xl font-bold text-[#E0E0E0]">
                      {index + 1}.
                    </div>

                    <div className="flex-1 group">
                      <div className="mb-2 flex items-center gap-3 sm:gap-5">
                        <div className="flex items-center gap-3 sm:gap-5">
                          <span className='text-lg sm:text-xl font-semibold text-[#E0E0E0]'>{item.label} </span>
                          <span className="pointer-events-none text-xs sm:text-sm font-medium text-[#6C6C6C] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                             Avg: {item.averagePoints} pts/participant
                          </span>
                        </div>
                      </div>
                      <div className="relative group">
                        <motion.div
                          className={`h-10 sm:h-12 rounded-lg ${getBarColor(index)} shadow-md`}
                          initial={{ width: 0 }}
                          animate={{ width: `${getBarWidth(index, items.length)}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                        <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-semibold text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                          {item.totalPoints} points
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
  );
};

export default HundredPointsPresenterView;
