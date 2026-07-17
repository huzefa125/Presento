import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Minus, Shuffle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MIN_ITEMS = 2;
const MAX_ITEMS = 10;

const HundredPointsEditor = ({ slide, onUpdate }) => {
  const { t } = useTranslation();
  const [question, setQuestion] = useState(slide?.question || '');
  const [items, setItems] = useState(() => {
    if (Array.isArray(slide?.hundredPointsItems) && slide.hundredPointsItems.length > 0) {
      return slide.hundredPointsItems.map((item) => ({
        id: item.id,
        label: item.label || ''
      }));
    }
    return [
      { id: uuidv4(), label: '' },
      { id: uuidv4(), label: '' },
      { id: uuidv4(), label: '' }
    ];
  });
  const isHydrating = useRef(true);

  useEffect(() => {
    isHydrating.current = true;
    setQuestion(slide?.question || '');
    if (Array.isArray(slide?.hundredPointsItems) && slide.hundredPointsItems.length > 0) {
      setItems(slide.hundredPointsItems.map((item) => ({
        id: item.id,
        label: item.label || ''
      })));
    } else {
      setItems([
        { id: uuidv4(), label: '' },
        { id: uuidv4(), label: '' },
        { id: uuidv4(), label: '' }
      ]);
    }
  }, [slide]);

  useEffect(() => {
    if (isHydrating.current) {
      isHydrating.current = false;
      return;
    }

    onUpdate?.({
      question,
      hundredPointsItems: items
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question, items]);

  const handleQuestionChange = (value) => {
    setQuestion(value);
  };

  const handleItemChange = (index, value) => {
    setItems((prev) => prev.map((item, idx) => (
      idx === index ? { ...item, label: value } : item
    )));
  };

  const handleAddItem = () => {
    if (items.length >= MAX_ITEMS) return;
    setItems((prev) => [...prev, { id: uuidv4(), label: '' }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= MIN_ITEMS) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleShuffle = () => {
    setItems((prev) => [...prev].sort(() => Math.random() - 0.5));
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin bg-canvas-soft text-ink">
      <div className="p-4 border-b border-hairline">
        <label className="block text-sm font-medium text-ink mb-2">{t('slide_editors.hundred_points.question_label')}</label>
        <textarea
          value={question}
          onChange={(event) => handleQuestionChange(event.target.value)}
          className="w-full px-3 py-2.5 border border-[#dddddd] rounded-xs text-sm bg-surface text-ink placeholder:text-ink-faint outline-none resize-none transition-shadow duration-150 focus:shadow-[var(--shadow-level-1)] focus:border-primary"
          placeholder={t('slide_editors.hundred_points.question_placeholder')}
          rows={3}
        />
      </div>

      <div className="p-4 border-b border-hairline">
        <div className="flex items-center justify-between mb-3">
          <div>
            <label className="block text-sm font-medium text-ink">{t('slide_editors.hundred_points.items_label')}</label>
            <p className="text-xs text-ink-muted">{t('slide_editors.hundred_points.instructions')}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShuffle}
              className="p-1.5 hover:bg-canvas-soft rounded transition-colors text-ink-secondary"
              title={t('slide_editors.hundred_points.shuffle_title')}
              disabled={items.length < 2}
            >
              <Shuffle className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleAddItem}
              className="p-1.5 hover:bg-canvas-soft rounded transition-colors text-ink-secondary"
              title={t('slide_editors.hundred_points.add_item_title')}
              disabled={items.length >= MAX_ITEMS}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={item.id} className="flex items-center gap-2">
              <span className="text-xs text-ink-muted w-4">{index + 1}.</span>
              <input
                type="text"
                value={item.label}
                onChange={(event) => handleItemChange(index, event.target.value)}
                className="flex-1 px-3 py-2.5 border border-[#dddddd] rounded-xs text-sm bg-surface text-ink placeholder:text-ink-faint outline-none transition-shadow duration-150 focus:shadow-[var(--shadow-level-1)] focus:border-primary"
                placeholder={t('slide_editors.hundred_points.item_with_number', { number: index + 1 })}
              />
              {items.length > MIN_ITEMS && (
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  className="p-2 hover:bg-canvas-soft rounded transition-colors"
                  title={t('slide_editors.hundred_points.remove_item_title')}
                >
                  <Minus className="h-4 w-4 text-accent-orange-deep" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 text-xs text-ink-muted border-t border-hairline">
        {t('slide_editors.hundred_points.items_range', { min: MIN_ITEMS, max: MAX_ITEMS })}
      </div>
    </div>
  );
};

export default HundredPointsEditor;
