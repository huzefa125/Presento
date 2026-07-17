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
    <div className="h-full overflow-y-auto scrollbar-thin bg-surface text-ink">
      <SlideTypeHeader type="open_ended" />
      <div className='p-4 border-b border-hairline'>
        <label className="block text-sm font-medium text-ink mb-2">
          {t('slide_editors.open_ended.question_label')}
        </label>
        <textarea
          value={question}
          onChange={(e) => handleQuestionChange(e.target.value)}
          className="w-full px-3 py-2 border border-hairline rounded-xs text-sm bg-surface text-ink placeholder:text-ink-faint focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
          placeholder={t('slide_editors.open_ended.question_placeholder')}
          rows={3}
        />
      </div>

      <p className="text-xs text-ink-muted p-4">
        {t('slide_editors.open_ended.voting_instructions')}
      </p>
    </div>
  );
};

export default OpenEndedEditor;