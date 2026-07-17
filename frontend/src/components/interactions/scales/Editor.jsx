import { useState, useEffect, useMemo } from 'react';
import { Plus, Minus } from 'lucide-react';
import SlideTypeHeader from '../common/SlideTypeHeader';
import { useTranslation } from 'react-i18next';

const MAX_STATEMENTS = 10;
const MIN_STATEMENTS = 1;

const ScalesEditor = ({ slide, onUpdate }) => {
  const { t } = useTranslation();
  const initialStatements = useMemo(() => {
    if (Array.isArray(slide?.statements) && slide.statements.length > 0) {
      // Normalize statements: extract text if it's an object, otherwise use as string
      return slide.statements.map(stmt => typeof stmt === 'string' ? stmt : (stmt?.text || ''));
    }
    return [''];
  }, [slide?.statements]);

  const [question, setQuestion] = useState(slide?.question || '');
  const [statements, setStatements] = useState(initialStatements);
  const [minValue, setMinValue] = useState(typeof slide?.minValue === 'number' ? slide.minValue : 0);
  const [maxValue, setMaxValue] = useState(typeof slide?.maxValue === 'number' ? slide.maxValue : 5);
  const [minLabel, setMinLabel] = useState(slide?.minLabel || '');
  const [maxLabel, setMaxLabel] = useState(slide?.maxLabel || '');

  useEffect(() => {
    setQuestion(slide?.question || '');
    setStatements(initialStatements);
    setMinValue(typeof slide?.minValue === 'number' ? slide.minValue : 0);
    setMaxValue(typeof slide?.maxValue === 'number' ? slide.maxValue : 5);
    setMinLabel(slide?.minLabel || '');
    setMaxLabel(slide?.maxLabel || '');
  }, [slide, initialStatements]);

  const emitUpdate = (overrides = {}) => {
    if (!onUpdate) return;
    onUpdate({
      ...slide,
      question,
      minValue,
      maxValue,
      minLabel,
      maxLabel,
      statements,
      ...overrides
    });
  };

  const handleQuestionChange = (value) => {
    setQuestion(value);
    emitUpdate({ question: value });
  };

  const handleStatementChange = (index, value) => {
    const nextStatements = statements.map((statement, idx) => (idx === index ? value : statement));
    setStatements(nextStatements);
    emitUpdate({ statements: nextStatements });
  };

  const handleAddStatement = () => {
    if (statements.length >= MAX_STATEMENTS) return;
    const nextStatements = [...statements, ''];
    setStatements(nextStatements);
    emitUpdate({ statements: nextStatements });
  };

  const handleRemoveStatement = (index) => {
    if (statements.length <= MIN_STATEMENTS) return;
    const nextStatements = statements.filter((_, idx) => idx !== index);
    setStatements(nextStatements);
    emitUpdate({ statements: nextStatements });
  };

  const handleMinValueChange = (value) => {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return;
    const safeValue = Math.min(parsed, maxValue - 1);
    setMinValue(safeValue);
    emitUpdate({ minValue: safeValue });
  };

  const handleMaxValueChange = (value) => {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return;
    const safeValue = Math.max(parsed, minValue + 1);
    setMaxValue(safeValue);
    emitUpdate({ maxValue: safeValue });
  };

  const handleMinLabelChange = (value) => {
    setMinLabel(value);
    emitUpdate({ minLabel: value });
  };

  const handleMaxLabelChange = (value) => {
    setMaxLabel(value);
    emitUpdate({ maxLabel: value });
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin bg-canvas text-ink">
      <SlideTypeHeader type="scales" />
      <div className="p-4 border-b border-hairline">
        <label className="block text-sm font-medium text-ink-secondary mb-2">{t('slide_editors.scales.question_label')}</label>
        <textarea
          value={question}
          onChange={(event) => handleQuestionChange(event.target.value)}
          className="w-full px-3 py-2 border border-hairline rounded-xs text-sm bg-surface text-ink placeholder-ink-faint outline-none transition-shadow duration-150 focus:shadow-[var(--shadow-level-1)] focus:border-primary resize-none"
          placeholder={t('slide_editors.scales.question_placeholder')}
          rows={3}
        />
      </div>

      <div className="p-4 border-b border-hairline">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-ink-secondary">{t('slide_editors.scales.statements_label')}</label>
          <button
            type="button"
            onClick={handleAddStatement}
            className="p-1.5 hover:bg-canvas-soft rounded-md transition-colors text-ink-secondary"
            title={t('slide_editors.scales.add_statement_title')}
            disabled={statements.length >= MAX_STATEMENTS}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2">
          {statements.map((statement, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-xs text-ink-muted w-4">{index + 1}.</span>
              <input
                type="text"
                value={statement}
                onChange={(event) => handleStatementChange(index, event.target.value)}
                className="flex-1 px-3 py-2 border border-hairline rounded-xs text-sm bg-surface text-ink placeholder-ink-faint outline-none transition-shadow duration-150 focus:shadow-[var(--shadow-level-1)] focus:border-primary"
                placeholder={t('slide_editors.scales.statement_with_number', { number: index + 1 })}
              />
              {statements.length > MIN_STATEMENTS && (
                <button
                  type="button"
                  onClick={() => handleRemoveStatement(index)}
                  className="p-2 hover:bg-canvas-soft rounded-md transition-colors"
                  title={t('slide_editors.scales.remove_statement_title')}
                >
                  <Minus className="h-4 w-4 text-ink-faint hover:text-accent-orange-deep" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4 border-b border-hairline">
        <h3 className="text-sm font-medium text-ink-secondary">{t('slide_editors.scales.settings_title')}</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">{t('slide_editors.scales.min_value_label')}</label>
            <input
              type="number"
              min={0}
              max={maxValue - 1}
              value={minValue}
              onChange={(event) => handleMinValueChange(event.target.value)}
              className="w-full px-3 py-2 border border-hairline rounded-xs text-sm bg-surface text-ink outline-none transition-shadow duration-150 focus:shadow-[var(--shadow-level-1)] focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">{t('slide_editors.scales.max_value_label')}</label>
            <input
              type="number"
              min={minValue + 1}
              max={10}
              value={maxValue}
              onChange={(event) => handleMaxValueChange(event.target.value)}
              className="w-full px-3 py-2 border border-hairline rounded-xs text-sm bg-surface text-ink outline-none transition-shadow duration-150 focus:shadow-[var(--shadow-level-1)] focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">
              {t('slide_editors.scales.min_label_with_value', { value: minValue })}
            </label>
            <input
              type="text"
              value={minLabel}
              onChange={(event) => handleMinLabelChange(event.target.value)}
              className="w-full px-3 py-2 border border-hairline rounded-xs text-sm bg-surface text-ink placeholder-ink-faint outline-none transition-shadow duration-150 focus:shadow-[var(--shadow-level-1)] focus:border-primary"
              placeholder={t('slide_editors.scales.min_label_placeholder')}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">
              {t('slide_editors.scales.max_label_with_value', { value: maxValue })}
            </label>
            <input
              type="text"
              value={maxLabel}
              onChange={(event) => handleMaxLabelChange(event.target.value)}
              className="w-full px-3 py-2 border border-hairline rounded-xs text-sm bg-surface text-ink placeholder-ink-faint outline-none transition-shadow duration-150 focus:shadow-[var(--shadow-level-1)] focus:border-primary"
              placeholder={t('slide_editors.scales.max_label_placeholder')}
            />
          </div>
        </div>
        <p className="text-xs text-ink-muted">
          {t('slide_editors.scales.results_description', { min: minValue, max: maxValue })}
        </p>
      </div>
    </div>
  );
}

export default ScalesEditor;
