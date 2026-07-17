import { useState, useEffect } from 'react';
import { Plus, Minus, ChevronDown, Image as ImageIcon } from 'lucide-react';

const MCQEditor = ({ slide, onUpdate }) => {
  const [question, setQuestion] = useState(slide?.question || '');
  const [options, setOptions] = useState(slide?.options || []);

  useEffect(() => {
    if (slide) {
      setQuestion(slide.question || '');
      // Normalize options: extract text if option is an object
      const normalizedOptions = (slide.options || []).map(opt =>
        typeof opt === 'string' ? opt : (opt?.text || '')
      );
      setOptions(normalizedOptions);
    }
  }, [slide]);

  const handleQuestionChange = (value) => {
    setQuestion(value);
    onUpdate({ ...slide, question: value });
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
    onUpdate({ ...slide, options: newOptions });
  };

  const addOption = () => {
    const newOptions = [...options, ''];
    setOptions(newOptions);
    onUpdate({ ...slide, options: newOptions });
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      onUpdate({ ...slide, options: newOptions });
    }
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      {/* Question Type */}
      <div className="p-4 border-b border-hairline">
        <label className="block text-sm font-medium text-ink-secondary mb-2">
          Question type
        </label>
        <div className="relative">
          <button className="w-full flex items-center justify-between px-3 py-2 border border-hairline rounded-md hover:border-ink-faint transition-colors bg-surface">
            <div className="flex items-center gap-2">
              <span className="text-primary">📊</span>
              <span className="text-sm text-ink-secondary">Multiple Choice</span>
            </div>
            <ChevronDown className="h-4 w-4 text-ink-faint" />
          </button>
        </div>
      </div>

      {/* Question Input */}
      <div className="p-4 border-b border-hairline">
        <label className="block text-sm font-medium text-ink-secondary mb-2">
          Question
        </label>
        <textarea
          value={question}
          onChange={(e) => handleQuestionChange(e.target.value)}
          className="w-full px-3 py-2 border border-hairline rounded-md text-sm bg-surface text-ink focus:shadow-[var(--shadow-level-1)] focus:border-primary outline-none resize-none"
          placeholder="Ask your question here..."
          rows={3}
        />
      </div>

      {/* Image Upload */}
      <div className="p-4 border-b border-hairline">
        <label className="block text-sm font-medium text-ink-secondary mb-2">
          Image
        </label>
        <p className="text-xs text-ink-faint mb-3">
          We support png, gif, jpg, jpeg and svg
        </p>
        <div className="border-2 border-dashed border-hairline rounded-md p-6 text-center hover:border-ink-faint transition-colors cursor-pointer">
          <ImageIcon className="h-8 w-8 text-ink-faint mx-auto mb-2" />
          <p className="text-sm text-ink-muted">Drag and drop or</p>
          <p className="text-sm text-primary font-medium">Click to add image</p>
        </div>
      </div>

      {/* Answer Options */}
      <div className="p-4 border-b border-hairline">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-ink-secondary">
            Answer options
          </label>
          <button
            onClick={addOption}
            className="p-1.5 hover:bg-canvas-soft rounded-md transition-colors"
            title="Add option"
          >
            <Plus className="h-4 w-4 text-ink-secondary" />
          </button>
        </div>

        <div className="space-y-2">
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2 bg-surface border border-hairline rounded-md px-1 py-1">
              <span className="text-xs text-ink-faint w-4 pl-2">{index + 1}.</span>
              <input
                type="text"
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                className="flex-1 px-2 py-2 border-0 rounded-md text-sm bg-transparent text-ink focus:outline-none"
                placeholder={`Option ${index + 1}`}
              />
              {options.length > 2 && (
                <button
                  onClick={() => removeOption(index)}
                  className="p-2 hover:bg-canvas-soft rounded-md transition-colors"
                  title="Remove option"
                >
                  <Minus className="h-4 w-4 text-accent-orange" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Background Settings */}
      <div className="p-4">
        <label className="block text-sm font-medium text-ink-secondary mb-2">
          Background
        </label>

        {/* Background Color */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-ink-muted">Background color</span>
          </div>
          <div className="relative">
            <button className="w-full flex items-center justify-between px-3 py-2 border border-hairline rounded-md hover:border-ink-faint transition-colors bg-surface">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-xs border border-hairline bg-surface"></div>
                <span className="text-sm text-ink-secondary">Default</span>
              </div>
              <ChevronDown className="h-4 w-4 text-ink-faint" />
            </button>
          </div>
        </div>

        {/* Background Image */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-ink-muted">Background image</span>
          </div>
          <button className="w-full px-3 py-2 border border-hairline rounded-md hover:border-ink-faint transition-colors text-sm text-ink-faint text-left bg-surface">
            + Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default MCQEditor;
