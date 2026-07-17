import { useMemo } from 'react';
import { Users } from 'lucide-react';

const colorPalette = ['#62aef0', '#391c57', '#ff64c8', '#dd5b00', '#2a9d99', '#1aae39', '#523410'];

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
      <div className="rounded-2xl sm:rounded-3xl border border-hairline bg-surface p-6 sm:p-10 shadow-[var(--shadow-level-2)]">
        <div className="flex flex-col gap-4 sm:gap-6">
          <div className="flex flex-col gap-3">

            {question && (
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-ink">{question}</h2>
            )}
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-ink-secondary">
            <div className="flex items-center gap-2 rounded-full bg-canvas-soft border border-primary/30 px-4 py-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-primary">{totalResponses} response{totalResponses === 1 ? '' : 's'}</span>
            </div>
             <div className="flex items-center justify-between text-sm font-semibold text-ink-muted">
              <span>{`Scale: ${domain.min} - ${domain.max}`}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl sm:rounded-3xl border border-hairline bg-surface p-6 sm:p-10 shadow-[var(--shadow-level-2)]">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-ink-muted">
          <span>{minLabel || 'Low'}</span>
          <span>{maxLabel || 'High'}</span>
        </div>
        <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
          {chartRows.map(({ statement, value, progress, count, color }, index) => (
            <div key={statement || index} className="space-y-2">
              <div className="flex items-center justify-between text-sm text-ink-secondary">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-on-primary" style={{ backgroundColor: color }}>
                    {index + 1}
                  </span>
                  <span className="font-medium text-ink">{statement || `Statement ${index + 1}`}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-ink-muted">
                  <span className="rounded-full bg-canvas-soft px-3 py-1 font-semibold text-ink">{value.toFixed(2)}</span>
                  <span>{count} response{count === 1 ? '' : 's'}</span>
                </div>
              </div>
              <div className="relative h-4 rounded-full bg-canvas-soft border border-hairline">
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
