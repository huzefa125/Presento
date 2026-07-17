import { useState, useEffect } from 'react';
import SlideTypeHeader from '../common/SlideTypeHeader';
import { useTranslation } from 'react-i18next';

const QnaEditor = ({ slide, onUpdate }) => {
  const { t } = useTranslation();
  const [question, setQuestion] = useState(slide?.question || '');
  const [allowMultiple, setAllowMultiple] = useState(
    slide?.qnaSettings?.allowMultiple ?? false
  );

  useEffect(() => {
    if (slide) {
      setQuestion(slide.question || '');
      setAllowMultiple(slide.qnaSettings?.allowMultiple ?? false);
    }
  }, [slide]);

  const handleQuestionChange = (value) => {
    setQuestion(value);
    if (onUpdate) {
      onUpdate({
        ...slide,
        question: value,
        qnaSettings: {
          ...(slide?.qnaSettings || {}),
          allowMultiple
        }
      });
    }
  };

  const handleAllowMultipleChange = (checked) => {
    setAllowMultiple(checked);
    if (onUpdate) {
      onUpdate({
        ...slide,
        question,
        qnaSettings: {
          ...(slide?.qnaSettings || {}),
          allowMultiple: checked
        }
      });
    }
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin bg-surface text-ink">
      <SlideTypeHeader type="qna" />
      <div className='p-4 border-b border-hairline'>
        <label className="block text-sm font-medium text-ink mb-2">
          {t('slide_editors.qna.question_label')}
        </label>
        <textarea
          value={question}
          onChange={(e) => handleQuestionChange(e.target.value)}
          className="w-full px-3 py-2 border border-hairline rounded-xs text-sm bg-surface text-ink placeholder:text-ink-faint focus:ring-2 focus:ring-primary focus-border-transparent outline-none resize-none"
          placeholder={t('slide_editors.qna.question_placeholder')}
          rows={3}
        />
      </div>

      <div className="border-t border-hairline p-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={allowMultiple}
            onChange={(e) => handleAllowMultipleChange(e.target.checked)}
            className="w-4 h-4 text-primary border-hairline rounded bg-surface focus:ring-primary focus:ring-offset-0"
          />
          <div>
            <span className="text-sm font-medium text-ink">
              {t('slide_editors.qna.allow_multiple_label')}
            </span>
            <p className="text-xs text-ink-muted mt-0.5">
              {t('slide_editors.qna.allow_multiple_description')}
            </p>
          </div>
        </label>
      </div>

      <div className="border-t border-hairline p-4">
        <p className="text-xs text-ink-muted">
          {t('slide_editors.qna.participant_instructions')}
        </p>
      </div>
    </div>
  );
};

export default QnaEditor;