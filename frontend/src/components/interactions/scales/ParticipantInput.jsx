import { useEffect, useMemo, useState } from 'react';
import { Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const colorPalette = ['#4F46E5', '#F97316', '#1D4ED8', '#10B981', '#EC4899', '#6366F1', '#0EA5E9'];

const ScalesParticipantInput = ({ 
  slide, 
  onSubmit, 
  hasSubmitted,
  scaleDistribution = {},
  scaleAverage = 0,
  scaleStatementAverages = {},
  totalResponses = 0
}) => {
  const { t } = useTranslation();
  const minValue = typeof slide?.minValue === 'number' ? slide.minValue : 1;
  const maxValue = typeof slide?.maxValue === 'number' ? slide.maxValue : 5;
  const statements = useMemo(() => {
    if (!Array.isArray(slide?.statements)) return [];
    // Normalize statements: extract text if it's an object, otherwise use as string
    return slide.statements.map(stmt => typeof stmt === 'string' ? stmt : (stmt?.text || ''));
  }, [slide?.statements]);

  const isMultiStatement = statements.length > 0;
  const defaultValue = minValue;

  const [values, setValues] = useState(() => (
    isMultiStatement ? statements.map(() => defaultValue) : [defaultValue]
  ));
  const [touched, setTouched] = useState(() => (
    isMultiStatement ? statements.map(() => false) : [false]
  ));
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isMultiStatement) {
      setValues(statements.map(() => defaultValue));
      setTouched(statements.map(() => false));
    } else {
      setValues([defaultValue]);
      setTouched([false]);
    }
  }, [slide?.id, isMultiStatement, statements.length, defaultValue, statements]);

  const markTouched = (index) => {
    setTouched((prev) => {
      const next = [...prev];
      next[index] = true;
      return next;
    });
  };

  const handleSliderChange = (index, raw) => {
    const parsed = Number(raw);
    setValues((prev) => {
      const next = [...prev];
      next[index] = parsed;
      return next;
    });
    markTouched(index);
  };

  const handleSubmit = async () => {
    if (hasSubmitted || isSubmitting) return;
    const hasAllTouched = touched.every(Boolean);
    if (!hasAllTouched) return;

    setIsSubmitting(true);
    try {
      if (isMultiStatement) {
        await onSubmit(values);
      } else {
        await onSubmit(values[0]);
      }
    } catch (error) {
      // Error handling: toast notification is handled by parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSlider = (value, index, label) => {
    const percentage = ((value - minValue) / (maxValue - minValue)) * 100;
    const color = colorPalette[index % colorPalette.length];
    const sliderId = `scale-slider-${slide?.id || 'default'}-${index}`;

    return (
      <div key={`slider-${index}`} className="space-y-3 overflow-hidden">
        <div className="space-y-1">
          <p className="text-sm sm:text-base font-medium text-[#E0E0E0]">
            {isMultiStatement 
              ? `${index + 1}. ${label || t('slide_editors.scales.statement_with_number', { number: index + 1 })}` 
              : label || slide?.question}
          </p>
          <div className="flex items-center gap-2 text-xs text-[#6C6C6C]">
            <span>{slide?.minLabel || `${minValue}`}</span>
            <span className="ml-auto text-[#4CAF50]">
              {touched[index] 
                ? t('slide_editors.scales.selected_value', { value }) 
                : t('slide_editors.scales.select_value')}
            </span>
          </div>
        </div>

        <input
          type="range"
          id={sliderId}
          min={minValue}
          max={maxValue}
          value={value}
          onChange={(event) => handleSliderChange(index, event.target.value)}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[#2A2A2A]"
          style={{ background: `linear-gradient(90deg, ${color} ${percentage}%, #2A2A2A ${percentage}%)` }}
          aria-label={isMultiStatement 
            ? t('slide_editors.scales.rate_statement', { number: index + 1, label }) 
            : t('slide_editors.scales.rate_label', { label: label || slide?.question })}
          aria-valuemin={minValue}
          aria-valuemax={maxValue}
          aria-valuenow={value}
        />

        {/* Scale numbers - show only min and max values */}
        <div className="flex justify-between text-xs text-[#6C6C6C]">
          <span>{slide?.minLabel || minValue}</span>
          <span>{slide?.maxLabel || maxValue}</span>
        </div>
      </div>
    );
  };

  // Helper to get average for a statement
  const getStatementAverage = (index) => {
    if (isMultiStatement && scaleStatementAverages[index] !== undefined) {
      return scaleStatementAverages[index];
    }
    return scaleAverage;
  };

  if (hasSubmitted) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-6 sm:space-y-8">
        {/* Submission confirmation */}
        <div className="rounded-2xl sm:rounded-3xl border border-[#4CAF50]/30 bg-[#1D2A20] p-6 sm:p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-[#2E7D32]/20">
            <svg className="h-8 w-8 sm:h-10 sm:w-10 text-[#4CAF50]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-[#E0E0E0]">{t('slide_editors.scales.response_submitted')}</h3>
          <p className="mt-2 text-sm text-[#B0B0B0]">{t('slide_editors.scales.thanks_rating')}</p>
        </div>

        {/* Live Results */}
        {totalResponses > 0 && (
          <div className="space-y-6 rounded-2xl sm:rounded-3xl border border-[#2A2A2A] bg-[#1F1F1F] p-6 sm:p-8 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl sm:text-2xl font-semibold text-[#E0E0E0]">{t('slide_editors.scales.live_results')}</h3>
              <div className="flex items-center gap-2 text-sm text-[#9E9E9E]">
                <div className="w-2 h-2 rounded-full bg-[#4CAF50] animate-pulse"></div>
                <span>{t('slide_editors.scales.response_count', { count: totalResponses, plural: totalResponses === 1 ? '' : 's' })}</span>
              </div>
            </div>

            {isMultiStatement ? (
              <div className="space-y-4">
                {statements.map((statement, index) => {
                  const avg = getStatementAverage(index);
                  
                  return (
                    <div key={`statement-${index}`} className="flex items-center justify-between py-2" role="group" aria-label={t('slide_editors.scales.statement_average', { number: index + 1, statement, average: avg.toFixed(1) })}>
                      <p className="text-base sm:text-lg font-medium text-[#E0E0E0] flex-1">
                        {index + 1}. {statement}
                      </p>
                      <div className="text-right ml-4">
                        <div className="text-lg sm:text-xl font-bold text-[#4CAF50]">
                          {avg.toFixed(1)}
                        </div>
                        <div className="text-xs text-[#6C6C6C]">{t('slide_editors.scales.average')}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-between py-2">
                <p className="text-base sm:text-lg font-medium text-[#E0E0E0] flex-1">
                  {slide?.question || t('slide_editors.scales.default_title')}
                </p>
                <div className="text-right ml-4">
                  <div className="text-lg sm:text-xl font-bold text-[#4CAF50]">
                    {scaleAverage.toFixed(1)}
                  </div>
                  <div className="text-xs text-[#6C6C6C]">{t('slide_editors.scales.average')}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  const allTouched = touched.every(Boolean);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 sm:space-y-8">
      {slide?.question && (
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold text-[#E0E0E0]">
            {typeof slide.question === 'string' 
              ? slide.question 
              : (slide.question?.text || slide.question?.label || '')}
          </h2>
        </div>
      )}

      <div className="space-y-6 rounded-2xl sm:rounded-3xl border border-[#2A2A2A] bg-[#1F1F1F] p-4 sm:p-6 md:p-8 shadow-xl overflow-hidden">
        {isMultiStatement
          ? statements.map((statement, index) => renderSlider(values[index], index, statement))
          : renderSlider(values[0], 0, slide?.question)}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || !allTouched}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#388E3C] to-[#2E7D32] hover:from-[#4CAF50] hover:to-[#388E3C] disabled:from-[#1F1F1F] disabled:to-[#1F1F1F] disabled:text-[#6C6C6C] px-6 py-3 text-base sm:text-lg font-semibold text-white transition-all active:scale-95 disabled:active:scale-100 disabled:cursor-not-allowed shadow-lg shadow-[#4CAF50]/20 disabled:shadow-none"
        >
          {isSubmitting ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-b-transparent" />
              {t('slide_editors.scales.submitting')}
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              {t('slide_editors.scales.submit_button')}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ScalesParticipantInput;
