import { useState, useEffect } from 'react';
import { Plus, Minus, Clock, Trophy, CheckCircle } from 'lucide-react';
import SlideTypeHeader from '../common/SlideTypeHeader';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from 'react-i18next';

const QuizEditor = ({ slide, onUpdate }) => {
  const { t } = useTranslation();
  const [question, setQuestion] = useState(slide?.question || '');
  const [options, setOptions] = useState(slide?.quizSettings?.options || [
    { id: uuidv4(), text: '' },
    { id: uuidv4(), text: '' }
  ]);
  const [correctOptionId, setCorrectOptionId] = useState(slide?.quizSettings?.correctOptionId || '');
  const [timeLimit, setTimeLimit] = useState(slide?.quizSettings?.timeLimit || 15);

  useEffect(() => {
    if (slide) {
      setQuestion(slide.question || '');
      setOptions(slide.quizSettings?.options || [
        { id: uuidv4(), text: '' },
        { id: uuidv4(), text: '' }
      ]);
      setCorrectOptionId(slide.quizSettings?.correctOptionId || '');
      setTimeLimit(slide.quizSettings?.timeLimit || 30);
    }
  }, [slide]);

  const handleQuestionChange = (value) => {
    setQuestion(value);
    updateSlide({ question: value });
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], text: value };
    setOptions(newOptions);
    updateSlide({ options: newOptions });
  };

  const addOption = () => {
    const newOptions = [...options, { id: uuidv4(), text: '' }];
    setOptions(newOptions);
    updateSlide({ options: newOptions });
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      const removedOptionId = options[index].id;
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      
      // If removed option was correct, clear correct answer
      if (correctOptionId === removedOptionId) {
        setCorrectOptionId('');
        updateSlide({ options: newOptions, correctOptionId: '' });
      } else {
        updateSlide({ options: newOptions });
      }
    }
  };

  const handleCorrectOptionChange = (optionId) => {
    setCorrectOptionId(optionId);
    updateSlide({ correctOptionId: optionId });
  };

  const handleTimeLimitChange = (value) => {
    const numValue = parseInt(value) || 30;
    const clampedValue = Math.max(5, Math.min(300, numValue));
    setTimeLimit(clampedValue);
    updateSlide({ timeLimit: clampedValue });
  };

  const updateSlide = (updates) => {
    const currentOptions = updates.options !== undefined ? updates.options : options;
    const currentCorrectId = updates.correctOptionId !== undefined ? updates.correctOptionId : correctOptionId;
    const currentTimeLimit = updates.timeLimit !== undefined ? updates.timeLimit : timeLimit;
    const currentQuestion = updates.question !== undefined ? updates.question : question;

    onUpdate({
      ...slide,
      type: 'quiz', // Ensure type is set to 'quiz'
      question: currentQuestion,
      quizSettings: {
        options: currentOptions,
        correctOptionId: currentCorrectId,
        timeLimit: currentTimeLimit,
        points: 1000
      }
    });
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin bg-[#1F1F1F] text-[#E0E0E0]">
      <SlideTypeHeader type="quiz" />

      {/* Question Input */}
      <div className="p-4 border-b border-[#2A2A2A]">
        <label className="block text-sm font-medium text-[#E0E0E0] mb-2">
          {t('slide_editors.quiz.question_label')}
        </label>
        <textarea
          value={question}
          onChange={(e) => handleQuestionChange(e.target.value)}
          className="w-full px-3 py-2 border border-[#2A2A2A] rounded-lg text-sm bg-[#232323] text-[#E0E0E0] placeholder-[#8A8A8A] focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent outline-none resize-none"
          placeholder={t('slide_editors.quiz.question_placeholder')}
          rows={3}
        />
      </div>

      {/* Time Limit */}
      <div className="p-4 border-b border-[#2A2A2A]">
        <label className="text-sm font-medium text-[#E0E0E0] mb-2 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {t('slide_editors.quiz.time_limit_label')}
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={timeLimit}
            onChange={(e) => handleTimeLimitChange(e.target.value)}
            min="5"
            max="300"
            className="w-24 px-3 py-2 border border-[#2A2A2A] rounded-lg text-sm bg-[#232323] text-[#E0E0E0] focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent outline-none"
          />
          <span className="text-xs text-[#9E9E9E]">
            {t('slide_editors.quiz.time_limit_range')}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-[#9E9E9E]">
          <Trophy className="h-3 w-3" />
          <span>{t('slide_editors.quiz.faster_answers_earn_more')}</span>
        </div>
      </div>

      {/* Answer Options */}
      <div className="p-4 border-b border-[#2A2A2A]">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-[#E0E0E0]">
            {t('slide_editors.quiz.answer_options_label')}
          </label>
          <button
            onClick={addOption}
            className="p-1.5 hover:bg-[#2A2A2A] rounded transition-colors text-[#E0E0E0]"
            title={t('slide_editors.quiz.add_option_title')}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          {options.map((option, index) => (
            <div key={option.id} className="flex items-center gap-3 group">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  id={`correct-${option.id}`}
                  checked={correctOptionId === option.id}
                  onChange={() => handleCorrectOptionChange(option.id)}
                  className="peer w-5 h-5 rounded border-2 border-[#3A3A3A] bg-[#1A1A1A] cursor-pointer appearance-none transition-all duration-200 hover:border-[#4CAF50] checked:bg-[#4CAF50] checked:border-[#4CAF50] focus:ring-2 focus:ring-[#4CAF50] focus:ring-offset-2 focus:ring-offset-[#1F1F1F]"
                />
                <CheckCircle 
                  className="absolute left-0 w-5 h-5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity duration-200" 
                  strokeWidth={3}
                />
              </div>
              <label 
                htmlFor={`correct-${option.id}`}
                className="text-xs text-[#9E9E9E] w-5 cursor-pointer"
              >
                {index + 1}.
              </label>
              <input
                type="text"
                value={option.text}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                className="flex-1 px-3 py-2.5 border border-[#2A2A2A] rounded-lg text-sm bg-[#232323] text-[#E0E0E0] placeholder-[#6A6A6A] focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent outline-none transition-all"
                placeholder={t('slide_editors.quiz.option_placeholder', { number: index + 1 })}
              />
              {options.length > 2 && (
                <button
                  onClick={() => removeOption(index)}
                  className="p-2 hover:bg-[#2A2A2A] rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  title={t('slide_editors.quiz.remove_option_title')}
                >
                  <Minus className="h-4 w-4 text-[#EF5350]" />
                </button>
              )}
            </div>
          ))}
        </div>

        {!correctOptionId && (
          <div className="mt-3 p-2 bg-[#2A2A2A] rounded-lg text-xs text-[#FFA726] flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span>{t('slide_editors.quiz.select_correct_answer')}</span>
          </div>
        )}
      </div>

      {/* Scoring Info */}
      <div className="p-4 bg-[#232323]">
        <h3 className="text-sm font-medium text-[#E0E0E0] mb-2 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-[#FFD700]" />
          {t('slide_editors.quiz.scoring_system')}
        </h3>
        <div className="space-y-1 text-xs text-[#9E9E9E]">
          <p>• {t('slide_editors.quiz.max_score')}: <span className="text-[#4CAF50]">1000 {t('slide_editors.quiz.points')}</span></p>
          <p>• {t('slide_editors.quiz.min_score')}: <span className="text-[#4CAF50]">500 {t('slide_editors.quiz.points')}</span></p>
          <p>• {t('slide_editors.quiz.incorrect_answer')}: <span className="text-[#EF5350]">0 {t('slide_editors.quiz.points')}</span></p>
          <p>• {t('slide_editors.quiz.bonus_for_speed')}</p>
          <p>• {t('slide_editors.quiz.scores_accumulate')}</p>
        </div>
      </div>
    </div>
  );
};

export default QuizEditor;