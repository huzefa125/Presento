import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Minus, Shuffle } from 'lucide-react';
import SlideTypeHeader from '../common/SlideTypeHeader';
import { useTranslation } from 'react-i18next';

const MIN_ITEMS = 1;
const MAX_ITEMS = 10;

const TwoByTwoGridEditor = ({ slide, onUpdate }) => {
  const { t } = useTranslation();
  const [question, setQuestion] = useState(slide?.question || '');
  const [items, setItems] = useState(() => {
    if (Array.isArray(slide?.gridItems) && slide.gridItems.length > 0) {
      return slide.gridItems.map((item) => ({
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
  
  const [axisXLabel, setAxisXLabel] = useState(slide?.gridAxisXLabel || '');
  
  const [axisYLabel, setAxisYLabel] = useState(slide?.gridAxisYLabel || '');
  
  const [axisRange, setAxisRange] = useState(() => ({
    min: slide?.gridAxisRange?.min ?? 0,
    max: slide?.gridAxisRange?.max ?? 10
  }));
  const [axisRangeInput, setAxisRangeInput] = useState(() => ({
    min: String(slide?.gridAxisRange?.min ?? 0),
    max: String(slide?.gridAxisRange?.max ?? 10)
  }));

  const isHydrating = useRef(true);

  useEffect(() => {
    isHydrating.current = true;
    setQuestion(slide?.question || '');
    if (Array.isArray(slide?.gridItems) && slide.gridItems.length > 0) {
      setItems(slide.gridItems.map((item) => ({
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
    setAxisXLabel(slide?.gridAxisXLabel || '');
    setAxisYLabel(slide?.gridAxisYLabel || '');
    const nextRange = {
      min: slide?.gridAxisRange?.min ?? 0,
      max: slide?.gridAxisRange?.max ?? 10
    };
    setAxisRange(nextRange);
    setAxisRangeInput({
      min: String(nextRange.min),
      max: String(nextRange.max)
    });
  }, [slide]);

  useEffect(() => {
    if (isHydrating.current) {
      isHydrating.current = false;
      return;
    }

    onUpdate?.({
      question,
      gridItems: items,
      gridAxisXLabel: axisXLabel,
      gridAxisYLabel: axisYLabel,
      gridAxisRange: axisRange
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question, items, axisXLabel, axisYLabel, axisRange]);

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

  const updateAxisRange = (nextMin, nextMax) => {
    let newMin = typeof nextMin === 'number' ? nextMin : axisRange.min;
    let newMax = typeof nextMax === 'number' ? nextMax : axisRange.max;

    if (!Number.isFinite(newMin)) newMin = axisRange.min;
    if (!Number.isFinite(newMax)) newMax = axisRange.max;

    if (newMax <= newMin) {
      if (typeof nextMin === 'number' && typeof nextMax !== 'number') {
        newMax = newMin + 1;
      } else if (typeof nextMax === 'number' && typeof nextMin !== 'number') {
        newMin = newMax - 1;
      } else {
        newMax = newMin + 1;
      }
    }

    setAxisRange({ min: newMin, max: newMax });
    setAxisRangeInput({ min: String(newMin), max: String(newMax) });
  };

  const handleAxisInputChange = (key, value) => {
    setAxisRangeInput((prev) => ({ ...prev, [key]: value }));

    if (value === '') {
      return;
    }

    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      return;
    }

    const nextMin = key === 'min' ? parsed : undefined;
    const nextMax = key === 'max' ? parsed : undefined;
    updateAxisRange(nextMin, nextMax);
  };

  const handleAxisBlur = (key) => {
    if (axisRangeInput[key] === '') {
      setAxisRangeInput((prev) => ({ ...prev, [key]: String(axisRange[key]) }));
    }
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin bg-[#1F1F1F] text-[#E0E0E0]">
      <SlideTypeHeader type="2x2_grid" />
      <div className="p-4 border-b border-[#2A2A2A]">
        <label className="block text-sm font-medium text-[#E0E0E0] mb-2">{t('slide_editors.two_by_two_grid.question_label')}</label>
        <textarea
          value={question}
          onChange={(event) => handleQuestionChange(event.target.value)}
          className="w-full px-3 py-2 border border-[#2A2A2A] rounded-lg text-sm bg-[#232323] text-[#E0E0E0] placeholder-[#8A8A8A] focus:ring-2 focus:ring-[#4CAF50] focus-border-transparent outline-none resize-none"
          placeholder={t('slide_editors.two_by_two_grid.question_placeholder')}
          rows={3}
        />
      </div>

      <div className="p-4 border-b border-[#2A2A2A]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <label className="block text-sm font-medium text-[#E0E0E0]">{t('slide_editors.two_by_two_grid.items_label')}</label>
            <p className="text-xs text-[#9E9E9E]">{t('slide_editors.two_by_two_grid.instructions')}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShuffle}
              className="p-1.5 hover:bg-[#2A2A2A] rounded transition-colors text-[#E0E0E0]"
              title={t('slide_editors.two_by_two_grid.shuffle_title')}
              disabled={items.length < 2}
            >
              <Shuffle className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleAddItem}
              className="p-1.5 hover:bg-[#2A2A2A] rounded transition-colors text-[#E0E0E0]"
              title={t('slide_editors.two_by_two_grid.add_item_title')}
              disabled={items.length >= MAX_ITEMS}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={item.id} className="flex items-center gap-2">
              <span className="text-xs text-[#9E9E9E] w-4">{index + 1}.</span>
              <input
                type="text"
                value={item.label}
                onChange={(event) => handleItemChange(index, event.target.value)}
                className="flex-1 px-3 py-2 border border-[#2A2A2A] rounded-lg text-sm bg-[#232323] text-[#E0E0E0] placeholder-[#8A8A8A] focus:ring-2 focus:ring-[#4CAF50] focus-border-transparent outline-none"
                placeholder={`${t('slide_editors.two_by_two_grid.item_placeholder')} ${index + 1}`}
              />
              {items.length > MIN_ITEMS && (
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  className="p-2 hover:bg-[#2A2A2A] rounded transition-colors"
                  title={t('slide_editors.two_by_two_grid.remove_item_title')}
                >
                  <Minus className="h-4 w-4 text-[#EF5350]" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-b border-[#2A2A2A]">
        <label className="block text-sm font-medium text-[#E0E0E0] mb-3">{t('slide_editors.two_by_two_grid.dimensions_label')}</label>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#9E9E9E] mb-2">{t('slide_editors.two_by_two_grid.horizontal_axis_label')}</label>
            <input
              type="text"
              value={axisXLabel}
              onChange={(e) => setAxisXLabel(e.target.value)}
              className="w-full px-3 py-2 border border-[#2A2A2A] rounded-lg text-sm bg-[#232323] text-[#E0E0E0] placeholder-[#8A8A8A] focus:ring-2 focus:ring-[#4CAF50] focus-border-transparent outline-none"
              placeholder={t('slide_editors.two_by_two_grid.horizontal_axis_placeholder')}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#9E9E9E] mb-2">{t('slide_editors.two_by_two_grid.vertical_axis_label')}</label>
            <input
              type="text"
              value={axisYLabel}
              onChange={(e) => setAxisYLabel(e.target.value)}
              className="w-full px-3 py-2 border border-[#2A2A2A] rounded-lg text-sm bg-[#232323] text-[#E0E0E0] placeholder-[#8A8A8A] focus:ring-2 focus:ring-[#4CAF50] focus-border-transparent outline-none"
              placeholder={t('slide_editors.two_by_two_grid.vertical_axis_placeholder')}
            />
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-[#2A2A2A]">
        <label className="block text-sm font-medium text-[#E0E0E0] mb-3">{t('slide_editors.two_by_two_grid.axis_range_label')}</label>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-[#9E9E9E] mb-1">{t('slide_editors.two_by_two_grid.min_value_label')}</label>
            <input
              type="number"
              value={axisRangeInput.min}
              onChange={(e) => handleAxisInputChange('min', e.target.value)}
              onBlur={() => handleAxisBlur('min')}
              className="w-full px-3 py-2 border border-[#2A2A2A] rounded-lg text-sm bg-[#232323] text-[#E0E0E0] focus:ring-2 focus:ring-[#4CAF50] focus-border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-[#9E9E9E] mb-1">{t('slide_editors.two_by_two_grid.max_value_label')}</label>
            <input
              type="number"
              value={axisRangeInput.max}
              onChange={(e) => handleAxisInputChange('max', e.target.value)}
              onBlur={() => handleAxisBlur('max')}
              className="w-full px-3 py-2 border border-[#2A2A2A] rounded-lg text-sm bg-[#232323] text-[#E0E0E0] focus:ring-2 focus:ring-[#4CAF50] focus-border-transparent outline-none"
            />
          </div>
        </div>
      </div>

      <div className="p-4 text-xs text-[#9E9E9E] border-t border-[#2A2A2A]">
        {t('slide_editors.two_by_two_grid.items_range', { min: MIN_ITEMS, max: MAX_ITEMS })}
      </div>
    </div>
  );
};

export default TwoByTwoGridEditor;
