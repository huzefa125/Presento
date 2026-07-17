import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PickAnswerEditor = ({ slide, onUpdate }) => {
  const { t } = useTranslation();
  const [question, setQuestion] = useState(slide?.question || '');
  // Normalize options: extract text if option is an object
  const normalizeOptions = (opts) => {
    if (!opts || opts.length === 0) return ['', ''];
    return opts.map(opt => typeof opt === 'string' ? opt : (opt?.text || ''));
  };
  const [options, setOptions] = useState(normalizeOptions(slide?.options) || ['', '']);

  // Update when slide changes
  useEffect(() => {
    if (slide) {
      setQuestion(slide.question || '');
      setOptions(normalizeOptions(slide.options) || ['', '']);
    }
  }, [slide]);

  // Update parent when question changes
  const handleQuestionChange = (value) => {
    setQuestion(value);
    onUpdate({ ...slide, question: value });
  };

  // Update parent when options change
  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
    onUpdate({ ...slide, options: newOptions });
  };

  // Add a new option
  const addOption = () => {
    const newOptions = [...options, ''];
    setOptions(newOptions);
    onUpdate({ ...slide, options: newOptions });
  };

  // Remove an option
  const removeOption = (index) => {
    if (options.length <= 2) return; // Minimum 2 options required
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
    onUpdate({ ...slide, options: newOptions });
  };

  return (
    <div className="space-y-6 p-4">
      {/* Question Input */}
      <div>
        <label className="block text-sm font-medium text-[#E0E0E0] mb-2">
          {t('slide_editors.pick_answer.question_label')}
        </label>
        <textarea
          value={question}
          onChange={(e) => handleQuestionChange(e.target.value)}
          placeholder={t('slide_editors.pick_answer.question_placeholder')}
          className="w-full bg-[#2A2A2A] border border-[#333333] rounded-lg px-3 py-2 text-[#E0E0E0] placeholder-[#666666] focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent resize-none"
          rows="3"
        />
      </div>

      {/* Options */}
      <div>
        <label className="block text-sm font-medium text-[#E0E0E0] mb-2">
          {t('slide_editors.pick_answer.answer_options_label')}
        </label>
        <div className="space-y-2">
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                placeholder={t('slide_editors.pick_answer.option_placeholder', { number: index + 1 })}
                className="flex-1 bg-[#2A2A2A] border border-[#333333] rounded-lg px-3 py-2 text-[#E0E0E0] placeholder-[#666666] focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
              />
              {options.length > 2 && (
                <button
                  onClick={() => removeOption(index)}
                  className="p-2 text-[#9E9E9E] hover:text-[#FF5252] hover:bg-[#333333] rounded-lg transition-colors"
                  aria-label={t('slide_editors.pick_answer.remove_option_label')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={addOption}
          className="mt-2 flex items-center gap-1 text-sm text-[#4CAF50] hover:text-[#45A049] transition-colors"
        >
          <Plus className="h-4 w-4" />
          {t('slide_editors.pick_answer.add_option')}
        </button>
      </div>
    </div>
  );
};

export default PickAnswerEditor;