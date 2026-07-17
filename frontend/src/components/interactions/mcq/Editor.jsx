import { useState, useEffect } from 'react';
import { Plus, Minus, ChevronDown, Image as ImageIcon } from 'lucide-react';
import SlideTypeHeader from '../common/SlideTypeHeader';
import { useTranslation } from 'react-i18next';

const MCQEditor = ({ slide, onUpdate }) => {
  const { t } = useTranslation();
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
    <div className="h-full overflow-y-auto scrollbar-thin bg-[#1F1F1F] text-[#E0E0E0]">
      <SlideTypeHeader type="multiple_choice" />

      <div className="p-4 border-b border-[#2A2A2A]">
        <label className="block text-sm font-medium text-[#E0E0E0] mb-2">
          {t('slide_editors.mcq.question_label')}
        </label>
        <textarea
          value={question}
          onChange={(e) => handleQuestionChange(e.target.value)}
          className="w-full px-3 py-2 border border-[#2A2A2A] rounded-lg text-sm bg-[#232323] text-[#E0E0E0] placeholder-[#8A8A8A] focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent outline-none resize-none"
          placeholder={t('slide_editors.mcq.question_placeholder')}
          rows={3}
        />
      </div>

      <div className="p-4 border-b border-[#2A2A2A]">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-[#E0E0E0]">
            {t('slide_editors.mcq.answer_options_label')}
          </label>
          <button
            onClick={addOption}
            className="p-1.5 hover:bg-[#2A2A2A] rounded transition-colors text-[#E0E0E0]"
            title={t('slide_editors.mcq.add_option_title')}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2">
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-xs text-[#9E9E9E] w-4">{index + 1}.</span>
              <input
                type="text"
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-[#2A2A2A] rounded-lg text-sm bg-[#232323] text-[#E0E0E0] placeholder-[#8A8A8A] focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent outline-none"
                placeholder={`${t('slide_editors.mcq.option_placeholder')} ${index + 1}`}
              />
              {options.length > 2 && (
                <button
                  onClick={() => removeOption(index)}
                  className="p-2 hover:bg-[#2A2A2A] rounded transition-colors"
                  title={t('slide_editors.mcq.remove_option_title')}
                >
                  <Minus className="h-4 w-4 text-[#EF5350]" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default MCQEditor;