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
      <div className="rounded-2xl sm:rounded-3xl border border-[#2A2A2A] bg-[#1F1F1F] p-6 sm:p-10 shadow-xl">
        <div className="flex flex-col gap-4 sm:gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#E0E0E0]">
              {slide?.question || 'Scale question'}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#6C6C6C]">
              {slide?.minLabel || `Min: ${minValue}`} · {slide?.maxLabel || `Max: ${maxValue}`}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
            <div className="rounded-xl sm:rounded-2xl bg-[#2A2A2A] border border-[#2F2F2F] p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6C6C6C]">Total responses</p>
              <p className="mt-2 text-2xl sm:text-3xl font-bold text-[#4CAF50]">{totalResponses}</p>
            </div>
            <div className="rounded-xl sm:rounded-2xl bg-[#1D2A20] border border-[#2E7D32]/30 p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#4CAF50]">Average</p>
              <p className="mt-2 text-2xl sm:text-3xl font-bold text-[#4CAF50]">{totalResponses > 0 ? scaleAverage.toFixed(1) : '-'}</p>
            </div>
            <div className="rounded-xl sm:rounded-2xl bg-[#2A2A2A] border border-[#2F2F2F] p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6C6C6C]">Range</p>
              <p className="mt-2 text-2xl sm:text-3xl font-bold text-[#E0E0E0]">{minValue} – {maxValue}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl sm:rounded-3xl border border-[#2A2A2A] bg-[#1F1F1F] p-6 sm:p-10 shadow-xl">
        <h3 className="mb-4 sm:mb-6 text-lg sm:text-xl font-semibold text-[#E0E0E0]">Distribution</h3>
        <div className="space-y-4">
          {distributionEntries.map(({ value, count, percentage }) => (
            <div key={value} className="space-y-2">
              <div className="flex items-center justify-between text-sm text-[#B0B0B0]">
                <span className="font-medium text-[#E0E0E0]">{value}</span>
                <span>{count} · {percentage}%</span>
              </div>
              <div className="h-3 rounded-full bg-[#2A2A2A]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#388E3C] to-[#4CAF50]"
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
