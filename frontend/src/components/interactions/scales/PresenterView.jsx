import ScalesPresenterChart from './PresenterChart';

const ScalesPresenterView = ({
  slide,
  scaleDistribution = {},
  scaleAverage = 0,
  scaleStatementAverages = [],
  scaleStatements = [],
  statementCounts = [],
  scaleOverallAverage = 0,
  totalResponses = 0
}) => {
  const hasMultiStatements = Array.isArray(scaleStatements) && scaleStatements.length > 0;

  if (hasMultiStatements) {
    return (
      <ScalesPresenterChart
        question={slide?.question}
        statements={scaleStatements}
        averages={scaleStatementAverages}
        counts={statementCounts}
        overallAverage={scaleOverallAverage}
        minValue={slide?.minValue}
        maxValue={slide?.maxValue}
        minLabel={slide?.minLabel}
        maxLabel={slide?.maxLabel}
        totalResponses={totalResponses}
      />
    );
  }

  const minValue = slide?.minValue ?? 1;
  const maxValue = slide?.maxValue ?? 5;
  const distributionEntries = Array.from({ length: maxValue - minValue + 1 }, (_, index) => {
    const value = minValue + index;
    const count = Number(scaleDistribution?.[value] ?? 0);
    const percentage = totalResponses > 0 ? Number(((count / totalResponses) * 100).toFixed(1)) : 0;
    return { value, count, percentage };
  });

  const maxCount = distributionEntries.reduce((acc, entry) => Math.max(acc, entry.count), 0) || 1;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="rounded-2xl sm:rounded-3xl border border-hairline bg-surface p-6 sm:p-10 shadow-[var(--shadow-level-2)]">
        <div className="flex flex-col gap-4 sm:gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-ink">
              {slide?.question || 'Scale question'}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-ink-muted">
              {slide?.minLabel || `Min: ${minValue}`} · {slide?.maxLabel || `Max: ${maxValue}`}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
            <div className="rounded-xl sm:rounded-2xl bg-canvas-soft border border-hairline p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Total responses</p>
              <p className="mt-2 text-2xl sm:text-3xl font-bold text-primary">{totalResponses}</p>
            </div>
            <div className="rounded-xl sm:rounded-2xl bg-canvas-soft border border-primary/30 p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Average</p>
              <p className="mt-2 text-2xl sm:text-3xl font-bold text-primary">{totalResponses > 0 ? scaleAverage.toFixed(1) : '-'}</p>
            </div>
            <div className="rounded-xl sm:rounded-2xl bg-canvas-soft border border-hairline p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Range</p>
              <p className="mt-2 text-2xl sm:text-3xl font-bold text-ink">{minValue} – {maxValue}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl sm:rounded-3xl border border-hairline bg-surface p-6 sm:p-10 shadow-[var(--shadow-level-2)]">
        <h3 className="mb-4 sm:mb-6 text-lg sm:text-xl font-semibold text-ink">Distribution</h3>
        <div className="space-y-4">
          {distributionEntries.map(({ value, count, percentage }) => (
            <div key={value} className="space-y-2">
              <div className="flex items-center justify-between text-sm text-ink-secondary">
                <span className="font-medium text-ink">{value}</span>
                <span>{count} · {percentage}%</span>
              </div>
              <div className="h-3 rounded-full bg-canvas-soft border border-hairline">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScalesPresenterView;
