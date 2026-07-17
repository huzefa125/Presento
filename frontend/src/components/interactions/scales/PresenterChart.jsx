import { useMemo } from 'react';
import { Users } from 'lucide-react';

const colorPalette = ['#4F46E5', '#F97316', '#1D4ED8', '#10B981', '#EC4899', '#6366F1', '#0EA5E9'];

const ScalesPresenterChart = ({
  question,
  statements = [],
  averages = [],
  counts = [],
  minValue = 1,
  maxValue = 5,
  minLabel,
  maxLabel,
  totalResponses = 0
}) => {
  const domain = useMemo(() => {
    const safeMin = typeof minValue === 'number' ? minValue : 1;
    const safeMax = typeof maxValue === 'number' ? maxValue : 5;
    if (safeMin >= safeMax) {
      return { min: 1, max: 5 };
    }
    return { min: safeMin, max: safeMax };
  }, [minValue, maxValue]);

  const chartRows = useMemo(() => {
    const { min, max } = domain;
    const span = max - min;
    return statements.map((statement, index) => {
      const value = typeof averages[index] === 'number' ? averages[index] : 0;
      const boundedValue = Math.min(Math.max(value, min), max);
      const progress = span === 0 ? 0 : ((boundedValue - min) / span) * 100;
      const count = counts[index] ?? 0;
      const color = colorPalette[index % colorPalette.length];
      return {
        statement,
        value: boundedValue,
        progress,
        count,
        color
      };
    });
  }, [statements, averages, counts, domain]);

  return (
    <div className="space-y-6 sm:space-y-10">
      <div className="rounded-2xl sm:rounded-3xl border border-[#2A2A2A] bg-[#1F1F1F] p-6 sm:p-10 shadow-xl">
        <div className="flex flex-col gap-4 sm:gap-6">
          <div className="flex flex-col gap-3">
           
            {question && (
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#E0E0E0]">{question}</h2>
            )}
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-[#B0B0B0]">
            <div className="flex items-center gap-2 rounded-full bg-[#1D2A20] border border-[#2E7D32]/30 px-4 py-2">
              <Users className="h-4 w-4 text-[#4CAF50]" />
              <span className="text-[#4CAF50]">{totalResponses} response{totalResponses === 1 ? '' : 's'}</span>
            </div>
             <div className="flex items-center justify-between text-sm font-semibold text-[#6C6C6C]">
              <span>{`Scale: ${domain.min} - ${domain.max}`}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl sm:rounded-3xl border border-[#2A2A2A] bg-[#1F1F1F] p-6 sm:p-10 shadow-xl">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-[#6C6C6C]">
          <span>{minLabel || 'Low'}</span>
          <span>{maxLabel || 'High'}</span>
        </div>
        <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
          {chartRows.map(({ statement, value, progress, count, color }, index) => (
            <div key={statement || index} className="space-y-2">
              <div className="flex items-center justify-between text-sm text-[#B0B0B0]">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-[#E0E0E0]" style={{ backgroundColor: color }}>
                    {index + 1}
                  </span>
                  <span className="font-medium text-[#E0E0E0]">{statement || `Statement ${index + 1}`}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#6C6C6C]">
                  <span className="rounded-full bg-[#2A2A2A] px-3 py-1 font-semibold text-[#E0E0E0]">{value.toFixed(2)}</span>
                  <span>{count} response{count === 1 ? '' : 's'}</span>
                </div>
              </div>
              <div className="relative h-4 rounded-full bg-[#2A2A2A]">
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: color,
                    transition: 'width 400ms ease'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScalesPresenterChart;
