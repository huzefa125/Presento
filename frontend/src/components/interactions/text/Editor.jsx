import { useState, useEffect } from 'react';
import { Type } from 'lucide-react';
import SlideTypeHeader from '../common/SlideTypeHeader';
import { useTranslation } from 'react-i18next';

const TextEditor = ({ slide, onUpdate }) => {
  const { t } = useTranslation();
  const [question, setQuestion] = useState(slide?.question || '');
  const [textContent, setTextContent] = useState(slide?.textContent || '');

  useEffect(() => {
    if (slide) {
      setQuestion(slide.question || '');
      setTextContent(slide.textContent || '');
    }
  }, [slide]);

  const handleQuestionChange = (value) => {
    setQuestion(value);
    onUpdate({ ...slide, question: value });
  };

  const handleTextContentChange = (value) => {
    setTextContent(value);
    onUpdate({ ...slide, textContent: value });
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin bg-[#1F1F1F] text-[#E0E0E0]">
      <SlideTypeHeader type="text" />

      <div className="p-4 border-b border-[#2A2A2A]">
        <label className="block text-sm font-medium text-[#E0E0E0] mb-2">
          {t('slide_editors.text.title_label')}
        </label>
        <input
          type="text"
          value={question}
          onChange={(e) => handleQuestionChange(e.target.value)}
          className="w-full px-3 py-2 border border-[#2A2A2A] rounded-lg text-sm bg-[#232323] text-[#E0E0E0] placeholder-[#8A8A8A] focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent outline-none"
          placeholder={t('slide_editors.text.title_placeholder')}
        />
      </div>

      <div className="p-4 border-b border-[#2A2A2A]">
        <label className="block text-sm font-medium text-[#E0E0E0] mb-2">
          {t('slide_editors.text.content_label')}
        </label>
        <textarea
          value={textContent}
          onChange={(e) => handleTextContentChange(e.target.value)}
          className="w-full px-3 py-2 border border-[#2A2A2A] rounded-lg text-sm bg-[#232323] text-[#E0E0E0] placeholder-[#8A8A8A] focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent outline-none resize-none"
          placeholder={t('slide_editors.text.content_placeholder')}
          rows={8}
        />
      </div>
    </div>
  );
};

export default TextEditor;