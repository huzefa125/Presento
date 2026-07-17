import { useState } from 'react';
import { ToggleLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const TypeAnswerEditor = ({ slide, onUpdate }) => {
  const { t } = useTranslation();
  const [question, setQuestion] = useState(slide?.question || '');
  const [isVotingEnabled, setIsVotingEnabled] = useState(
    slide?.openEndedSettings?.isVotingEnabled || false
  );

  // Update parent when question changes
  const handleQuestionChange = (value) => {
    setQuestion(value);
    onUpdate({ ...slide, question: value });
  };

  // Update parent when voting setting changes
  const handleVotingToggle = () => {
    const newValue = !isVotingEnabled;
    setIsVotingEnabled(newValue);
    onUpdate({
      ...slide,
      openEndedSettings: {
        ...slide?.openEndedSettings,
        isVotingEnabled: newValue
      }
    });
  };

  return (
    <div className="space-y-6 p-4">
      {/* Question Input */}
      <div>
        <label className="block text-sm font-medium text-[#E0E0E0] mb-2">
          {t('slide_editors.type_answer.question_label')}
        </label>
        <textarea
          value={question}
          onChange={(e) => handleQuestionChange(e.target.value)}
          placeholder={t('slide_editors.type_answer.question_placeholder')}
          className="w-full bg-[#2A2A2A] border border-[#333333] rounded-lg px-3 py-2 text-[#E0E0E0] placeholder-[#666666] focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent resize-none"
          rows="3"
        />
      </div>

      {/* Voting Toggle */}
      <div className="flex items-center justify-between p-3 bg-[#2A2A2A] rounded-lg">
        <div className="flex items-center gap-2">
          <ToggleLeft className="h-5 w-5 text-[#4CAF50]" />
          <span className="text-[#E0E0E0]">{t('slide_editors.type_answer.enable_voting')}</span>
        </div>
        <button
          onClick={handleVotingToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            isVotingEnabled ? 'bg-[#4CAF50]' : 'bg-[#333333]'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isVotingEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Info Text */}
      <div className="text-sm text-[#9E9E9E] bg-[#2A2A2A] p-3 rounded-lg">
        {t('slide_editors.type_answer.participants_instruction')} {isVotingEnabled ? t('slide_editors.type_answer.voting_enabled') : t('slide_editors.type_answer.voting_disabled')}
      </div>
    </div>
  );
};

export default TypeAnswerEditor;