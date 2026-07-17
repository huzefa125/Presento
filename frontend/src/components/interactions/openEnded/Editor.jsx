import { useState, useEffect } from 'react';
import SlideTypeHeader from '../common/SlideTypeHeader';
import { useTranslation } from 'react-i18next';

const OpenEndedEditor = ({ slide, onUpdate }) => {
  const { t } = useTranslation();
  const [question, setQuestion] = useState(slide?.question || '');

  useEffect(() => {
    if (slide) {
      setQuestion(slide.question || '');
    }
  }, [slide]);

  const handleQuestionChange = (value) => {
    setQuestion(value);
    if (onUpdate) {
      onUpdate({
        ...slide,
        question: value,
        openEndedSettings: slide.openEndedSettings ? { ...slide.openEndedSettings } : undefined
      });
    }
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin bg-[#1F1F1F] text-[#E0E0E0]">
      <SlideTypeHeader type="open_ended" />
      <div className='p-4 border-b border-[#2A2A2A]'>
        <label className="block text-sm font-medium text-[#E0E0E0] mb-2">
          {t('slide_editors.open_ended.question_label')}
        </label>
        <textarea
          value={question}
          onChange={(e) => handleQuestionChange(e.target.value)}
          className="w-full px-3 py-2 border border-[#2A2A2A] rounded-lg text-sm bg-[#232323] text-[#E0E0E0] placeholder-[#8A8A8A] focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent outline-none resize-none"
          placeholder={t('slide_editors.open_ended.question_placeholder')}
          rows={3}
        />
      </div>

      <p className="text-xs text-[#9E9E9E] p-4">
        {t('slide_editors.open_ended.voting_instructions')}
      </p>
    </div>
  );
};

export default OpenEndedEditor;