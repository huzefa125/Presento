import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const DEFAULT_MIN = 1;
const DEFAULT_MAX = 10;
const DEFAULT_CORRECT = 5;

const GuessNumberEditor = ({ slide, onUpdate }) => {
  const { t } = useTranslation();
  const [question, setQuestion] = useState(slide?.question || '');
  const [minValue, setMinValue] = useState(slide?.guessNumberSettings?.minValue ?? DEFAULT_MIN);
  const [maxValue, setMaxValue] = useState(slide?.guessNumberSettings?.maxValue ?? DEFAULT_MAX);
  const [correctAnswer, setCorrectAnswer] = useState(slide?.guessNumberSettings?.correctAnswer ?? DEFAULT_CORRECT);

  const [minValueInput, setMinValueInput] = useState(String(slide?.guessNumberSettings?.minValue ?? DEFAULT_MIN));
  const [maxValueInput, setMaxValueInput] = useState(String(slide?.guessNumberSettings?.maxValue ?? DEFAULT_MAX));
  const [correctAnswerInput, setCorrectAnswerInput] = useState(String(slide?.guessNumberSettings?.correctAnswer ?? DEFAULT_CORRECT));

  useEffect(() => {
    if (slide) {
      const nextQuestion = slide.question || '';
      const nextMin = slide.guessNumberSettings?.minValue ?? DEFAULT_MIN;
      const nextMax = slide.guessNumberSettings?.maxValue ?? DEFAULT_MAX;
      const nextCorrect = slide.guessNumberSettings?.correctAnswer ?? DEFAULT_CORRECT;

      setQuestion(nextQuestion);
      setMinValue(nextMin);
      setMaxValue(nextMax);
      setCorrectAnswer(nextCorrect);
      setMinValueInput(String(nextMin));
      setMaxValueInput(String(nextMax));
      setCorrectAnswerInput(String(nextCorrect));
    }
  }, [slide]);

  const emitUpdate = (nextMin, nextMax, nextCorrect) => {
    if (!onUpdate) return;
    onUpdate({
      ...slide,
      question,
      guessNumberSettings: {
        minValue: nextMin,
        maxValue: nextMax,
        correctAnswer: nextCorrect
      }
    });
  };

  const applyRange = ({ min, max, correct }) => {
    let newMin = typeof min === 'number' ? min : minValue;
    let newMax = typeof max === 'number' ? max : maxValue;

    if (!Number.isFinite(newMin)) newMin = minValue;
    if (!Number.isFinite(newMax)) newMax = maxValue;

    if (newMax <= newMin) {
      if (typeof min === 'number' && typeof max !== 'number') {
        newMax = newMin + 1;
      } else if (typeof max === 'number' && typeof min !== 'number') {
        newMin = newMax - 1;
      } else {
        newMax = newMin + 1;
      }
    }

    if (newMin < Number.MIN_SAFE_INTEGER) newMin = DEFAULT_MIN;
    if (newMax > Number.MAX_SAFE_INTEGER) newMax = DEFAULT_MAX;

    let newCorrect = typeof correct === 'number' ? correct : correctAnswer;
    if (!Number.isFinite(newCorrect)) newCorrect = correctAnswer;
    newCorrect = Math.min(Math.max(newCorrect, newMin), newMax);

    setMinValue(newMin);
    setMaxValue(newMax);
    setCorrectAnswer(newCorrect);
    setMinValueInput(String(newMin));
    setMaxValueInput(String(newMax));
    setCorrectAnswerInput(String(newCorrect));
    emitUpdate(newMin, newMax, newCorrect);
  };

  const handleQuestionChange = (value) => {
    setQuestion(value);
    if (onUpdate) {
      onUpdate({
        ...slide,
        question: value,
        guessNumberSettings: {
          minValue,
          maxValue,
          correctAnswer
        }
      });
    }
  };

  const handleMinValueChange = (value) => {
    setMinValueInput(value);

    if (value === '') {
      return;
    }

    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      return;
    }

    applyRange({ min: parsed });
  };

  const handleMaxValueChange = (value) => {
    setMaxValueInput(value);

    if (value === '') {
      return;
    }

    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      return;
    }

    applyRange({ max: parsed });
  };

  const handleCorrectAnswerChange = (value) => {
    setCorrectAnswerInput(value);

    if (value === '') {
      return;
    }

    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      return;
    }

    applyRange({ correct: parsed });
  };

  const handleMinBlur = () => {
    if (minValueInput === '') {
      setMinValueInput(String(minValue));
    }
  };

  const handleMaxBlur = () => {
    if (maxValueInput === '') {
      setMaxValueInput(String(maxValue));
    }
  };

  const handleCorrectBlur = () => {
    if (correctAnswerInput === '') {
      setCorrectAnswerInput(String(correctAnswer));
    }
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin bg-[#1F1F1F] text-[#E0E0E0]">
      <div className="p-4 border-b border-[#2A2A2A] space-y-6">
        <div>
          <label className="block text-sm font-medium text-[#E0E0E0] mb-2">
            {t('slide_editors.guess_number.question_label')}
          </label>
          <textarea
            value={question}
            onChange={(e) => handleQuestionChange(e.target.value)}
            className="w-full px-3 py-2 border border-[#2A2A2A] rounded-lg text-sm bg-[#232323] text-[#E0E0E0] placeholder-[#8A8A8A] focus:ring-2 focus:ring-[#4CAF50] focus-border-transparent outline-none resize-none"
            placeholder={t('slide_editors.guess_number.question_placeholder')}
            rows={3}
          />
        </div>

        <div className="border-t border-[#2A2A2A] pt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#E0E0E0] mb-2">
              {t('slide_editors.guess_number.range_label')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#9E9E9E] mb-1">{t('slide_editors.guess_number.min_value_label')}</label>
                <input
                  type="number"
                  value={minValueInput}
                  onChange={(e) => handleMinValueChange(e.target.value)}
                  onBlur={handleMinBlur}
                  className="w-full px-3 py-2 border border-[#2A2A2A] rounded-lg text-sm bg-[#232323] text-[#E0E0E0] focus:ring-2 focus:ring-[#4CAF50] focus-border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-[#9E9E9E] mb-1">{t('slide_editors.guess_number.max_value_label')}</label>
                <input
                  type="number"
                  value={maxValueInput}
                  onChange={(e) => handleMaxValueChange(e.target.value)}
                  onBlur={handleMaxBlur}
                  className="w-full px-3 py-2 border border-[#2A2A2A] rounded-lg text-sm bg-[#232323] text-[#E0E0E0] focus:ring-2 focus:ring-[#4CAF50] focus-border-transparent outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#E0E0E0] mb-2">
              {t('slide_editors.guess_number.correct_answer_label')}
            </label>
            <input
              type="number"
              value={correctAnswerInput}
              onChange={(e) => handleCorrectAnswerChange(e.target.value)}
              onBlur={handleCorrectBlur}
              min={minValue}
              max={maxValue}
              className="w-full px-3 py-2 border border-[#2A2A2A] rounded-lg text-sm bg-[#232323] text-[#E0E0E0] focus:ring-2 focus:ring-[#4CAF50] focus-border-transparent outline-none"
            />
            <p className="text-xs text-[#9E9E9E] mt-1">
              {t('slide_editors.guess_number.correct_answer_range', { min: minValue, max: maxValue })}
            </p>
          </div>
        </div>

        <div className="border-t border-[#2A2A2A] pt-4">
          <p className="text-xs text-[#9E9E9E]">
            {t('slide_editors.guess_number.instructions')}
          </p>
        </div>
      </div>
    </div>
  );
}

export default GuessNumberEditor;
