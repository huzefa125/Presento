import { useEffect, useState } from 'react';
import SlideTypeHeader from '../common/SlideTypeHeader';
import { useTranslation } from 'react-i18next';

const MIN_WORDS = 1;
const MAX_WORDS = 10;

const clamp = (value) => Math.max(MIN_WORDS, Math.min(MAX_WORDS, value));

const WordCloudEditor = ({ slide, onUpdate }) => {
  const { t } = useTranslation();
  const [question, setQuestion] = useState(slide?.question || '');
  const [maxWords, setMaxWords] = useState(slide?.maxWordsPerParticipant ?? MIN_WORDS);
  const [maxWordsInput, setMaxWordsInput] = useState(String(slide?.maxWordsPerParticipant ?? MIN_WORDS));

  useEffect(() => {
    const nextQuestion = slide?.question || '';
    const nextMaxWords = slide?.maxWordsPerParticipant ?? MIN_WORDS;

    setQuestion(nextQuestion);
    setMaxWords(nextMaxWords);
    setMaxWordsInput(String(nextMaxWords));
  }, [slide?.question, slide?.maxWordsPerParticipant]);

  const emitUpdate = (overrides = {}) => {
    onUpdate?.({
      ...slide,
      question,
      maxWordsPerParticipant: maxWords,
      ...overrides
    });
  };

  const handleQuestionChange = (value) => {
    setQuestion(value);
    emitUpdate({ question: value });
  };

  const handleMaxWordsChange = (value) => {
    setMaxWordsInput(value);

    if (value === '') {
      return;
    }

    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      return;
    }

    setMaxWords(parsed);
    if (parsed >= MIN_WORDS && parsed <= MAX_WORDS) {
      emitUpdate({ maxWordsPerParticipant: parsed });
    }
  };

  const handleMaxWordsBlur = () => {
    if (maxWordsInput === '') {
      setMaxWords(MIN_WORDS);
      setMaxWordsInput(String(MIN_WORDS));
      emitUpdate({ maxWordsPerParticipant: MIN_WORDS });
      return;
    }

    const parsed = Number(maxWordsInput);
    if (Number.isNaN(parsed)) {
      setMaxWords(MIN_WORDS);
      setMaxWordsInput(String(MIN_WORDS));
      emitUpdate({ maxWordsPerParticipant: MIN_WORDS });
      return;
    }

    const clamped = clamp(parsed);
    setMaxWords(clamped);
    setMaxWordsInput(String(clamped));
    emitUpdate({ maxWordsPerParticipant: clamped });
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin bg-[#1F1F1F] text-[#E0E0E0]">
      <SlideTypeHeader type="word_cloud" />

      <div className="p-4 space-y-4 border-b border-[#2A2A2A]">
        <div>
          <label className="block text-sm font-medium text-[#E0E0E0] mb-2">
            {t('slide_editors.word_cloud.question_label')}
          </label>
          <textarea
            value={question}
            onChange={(event) => handleQuestionChange(event.target.value)}
            className="w-full px-3 py-2 border border-[#2A2A2A] rounded-lg text-sm bg-[#232323] text-[#E0E0E0] placeholder-[#8A8A8A] focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent outline-none resize-none"
            placeholder={t('slide_editors.word_cloud.question_placeholder')}
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#E0E0E0] mb-1">
            {t('slide_editors.word_cloud.max_words_label')}
          </label>
          <input
            type="number"
            min={MIN_WORDS}
            max={MAX_WORDS}
            value={maxWordsInput}
            onChange={(event) => handleMaxWordsChange(event.target.value)}
            onBlur={handleMaxWordsBlur}
            className="w-full px-3 py-2 border border-[#2A2A2A] rounded-lg bg-[#232323] text-[#E0E0E0] focus:ring-2 focus:ring-[#4CAF50] focus-border-transparent outline-none"
          />
          <p className="text-xs text-[#9E9E9E] mt-1">
            {t('slide_editors.word_cloud.words_range', { min: MIN_WORDS, max: MAX_WORDS })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WordCloudEditor;