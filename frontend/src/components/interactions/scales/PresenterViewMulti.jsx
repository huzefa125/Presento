import { useMemo } from 'react';
import { Users } from 'lucide-react';

const ScalesPresenterViewMulti = ({
  slide,
  scaleStatementAverages = {},
  scaleStatements = [],
  statementCounts = {},
  totalResponses = 0
}) => {
  const minValue = slide?.minValue ?? 1;
  const maxValue = slide?.maxValue ?? 5;
  const statements = scaleStatements.length > 0 ? scaleStatements : (slide?.statements || []);

  // Calculate overall average across all statements
  const overallAverage = useMemo(() => {
    const averages = Object.values(scaleStatementAverages).filter(v => v > 0);
    if (averages.length === 0) return 0;
    return (averages.reduce((sum, avg) => sum + avg, 0) / averages.length).toFixed(2);
  }, [scaleStatementAverages]);

  // Calculate bar height percentage based on average value
  const getBarHeight = (average) => {
    if (!average || average === 0) return 0;
    return ((average - minValue) / (maxValue - minValue)) * 100;
  };

  // Get decorative sticker color based on value (low to high)
  const getBarColor = (average) => {
    const normalized = (average - minValue) / (maxValue - minValue);
    if (normalized < 0.33) return 'bg-accent-orange-deep';
    if (normalized < 0.67) return 'bg-accent-orange';
    return 'bg-accent-green';
  };

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <div className="bg-surface rounded-3xl shadow-[var(--shadow-level-2)] border border-hairline p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex-1">
            {slide?.question && (
              <h2 className="text-3xl font-bold text-ink leading-tight mb-3">
                {slide.question}
              </h2>
            )}
            {(slide?.minLabel || slide?.maxLabel) && (
              <div className="flex items-center gap-4 text-sm text-ink-secondary">
                {slide?.minLabel && (
                  <span className="flex items-center gap-1">
                    <span className="font-medium">{minValue}:</span> {slide.minLabel}
                  </span>
                )}
                {slide?.maxLabel && (
                  <span className="flex items-center gap-1">
                    <span className="font-medium">{maxValue}:</span> {slide.maxLabel}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <div className="bg-canvas-soft border border-hairline rounded-2xl px-6 py-4 min-w-[140px]">
              <div className="flex items-center gap-2 text-primary mb-1">
                <Users className="h-5 w-5" />
                <span className="text-sm font-medium">Responses</span>
              </div>
              <p className="text-3xl font-bold text-ink">{totalResponses}</p>
            </div>

            <div className="bg-canvas-soft border border-primary/30 rounded-2xl px-6 py-4 min-w-[140px]">
              <div className="text-sm font-medium text-primary mb-1">
                Overall Avg
              </div>
              <p className="text-3xl font-bold text-ink">
                {totalResponses > 0 ? overallAverage : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-surface rounded-3xl shadow-[var(--shadow-level-2)] border border-hairline p-8">
        <h3 className="text-xl font-semibold text-ink mb-6">Statement Averages</h3>

        {totalResponses === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-canvas-soft mb-4">
              <Users className="h-8 w-8 text-ink-faint" />
            </div>
            <p className="text-ink-muted text-lg">Waiting for responses...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Vertical Bar Chart (Mentimeter Style) */}
            <div className="relative">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 bottom-12 w-12 flex flex-col justify-between text-right pr-2 text-sm text-ink-secondary font-medium">
                {Array.from({ length: maxValue - minValue + 1 }, (_, i) => maxValue - i).map((val) => (
                  <div key={val} className="h-0 flex items-center">
                    {val}
                  </div>
                ))}
              </div>

              {/* Chart area */}
              <div className="ml-14 pl-4 border-l-2 border-b-2 border-hairline">
                <div className="flex items-end justify-start gap-4 h-96 pb-2">
                  {statements.map((statement, index) => {
                    const average = scaleStatementAverages[index] || 0;
                    const height = getBarHeight(average);
                    const count = statementCounts[index] || 0;

                    return (
                      <div key={index} className="flex flex-col items-center flex-1 max-w-[120px] min-w-[80px]">
                        {/* Bar */}
                        <div className="w-full flex flex-col justify-end h-full">
                          <div
                            className={`w-full ${getBarColor(average)} rounded-t-lg transition-all duration-500 ease-out relative group`}
                            style={{ height: `${height}%`, minHeight: average > 0 ? '24px' : '0' }}
                          >
                            {average > 0 && (
                              <>
                                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-surface border border-hairline text-ink text-xs font-semibold px-3 py-1.5 rounded shadow-[var(--shadow-level-1)] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                  Avg: {average} ({count} response{count !== 1 ? 's' : ''})
                                </div>
                                <span className="absolute inset-0 flex items-center justify-center text-on-primary font-bold text-lg drop-shadow">
                                  {average}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Statement label */}
                        <div className="mt-3 text-center w-full">
                          <div className="text-xs text-ink font-medium line-clamp-2 leading-tight">
                            {statement}
                          </div>
                          <div className="text-xs text-ink-muted mt-1">
                            {count} vote{count !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* X-axis label */}
              <div className="ml-14 mt-2 text-center text-sm text-ink-secondary font-medium">
                Statements
              </div>
            </div>

            {/* Horizontal bars as alternative view */}
            <div className="pt-8 border-t border-hairline">
              <h4 className="text-lg font-semibold text-ink mb-4">Detailed View</h4>
              <div className="space-y-3">
                {statements.map((statement, index) => {
                  const average = scaleStatementAverages[index] || 0;
                  const count = statementCounts[index] || 0;
                  const barWidth = getBarHeight(average);

                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-ink flex-1 pr-4">
                          {index + 1}. {statement}
                        </span>
                        <span className="text-ink-secondary font-semibold min-w-[80px] text-right">
                          Avg: {average > 0 ? average : '-'}
                        </span>
                      </div>
                      <div className="relative h-8 bg-canvas-soft border border-hairline rounded-lg overflow-hidden">
                        <div
                          className={`absolute inset-y-0 left-0 ${getBarColor(average)} rounded-lg transition-all duration-500 ease-out flex items-center justify-end pr-3`}
                          style={{ width: `${barWidth}%` }}
                        >
                          {average > 0 && (
                            <span className="text-on-primary font-semibold text-sm drop-shadow">
                              {average}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-ink-muted">
                        {count} response{count !== 1 ? 's' : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Statistics Summary */}
      {totalResponses > 0 && (
        <div className="bg-surface rounded-3xl border border-hairline shadow-[var(--shadow-level-1)] p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-ink-muted mb-1">Total Responses</p>
              <p className="text-2xl font-bold text-ink">{totalResponses}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-ink-muted mb-1">Overall Average</p>
              <p className="text-2xl font-bold text-primary">{overallAverage}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-ink-muted mb-1">Scale Range</p>
              <p className="text-2xl font-bold text-ink">{minValue} - {maxValue}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-ink-muted mb-1">Statements</p>
              <p className="text-2xl font-bold text-ink">{statements.length}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScalesPresenterViewMulti;
