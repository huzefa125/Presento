import { BarChart2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PickAnswerPresenterResults from './PresenterResults';

const PickAnswerPresenterView = ({
  slide,
  responses = [],
  voteCounts: externalVoteCounts,
  totalResponses: externalTotalResponses,
  sendSocketMessage
}) => {
  const { t } = useTranslation();
  
  // Use external voteCounts if provided, otherwise compute from responses
  let voteCounts = externalVoteCounts || {};
  let totalResponses = externalTotalResponses;
  
  if (!externalVoteCounts && responses.length > 0) {
    // Count votes for each option - normalize keys to strings
    voteCounts = {};
    if (slide.options) {
      slide.options.forEach(option => {
        const key = typeof option === 'string' ? option : (option?.text || String(option));
        voteCounts[key] = 0;
      });
    }

    responses.forEach(response => {
      const answerKey = typeof response.answer === 'string' ? response.answer : (response.answer?.text || String(response.answer));
      if (voteCounts.hasOwnProperty(answerKey)) {
        voteCounts[answerKey]++;
      }
    });

    totalResponses = responses.length;
  } else if (externalVoteCounts) {
    // Use external voteCounts, compute totalResponses if not provided
    totalResponses = externalTotalResponses || Object.values(voteCounts).reduce((sum, count) => sum + count, 0);
  } else {
    // Initialize empty voteCounts
    if (slide.options) {
      slide.options.forEach(option => {
        const key = typeof option === 'string' ? option : (option?.text || String(option));
        voteCounts[key] = 0;
      });
    }
    totalResponses = totalResponses || 0;
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="bg-[#1F1F1F] rounded-2xl sm:rounded-3xl border border-[#2A2A2A] shadow-xl p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#E0E0E0] leading-tight">
              {slide?.question || t('slide_editors.pick_answer.default_title')}
            </h2>
            <p className="text-xs sm:text-sm text-[#6C6C6C] mt-2 flex items-center gap-1">
              <BarChart2 className="h-4 w-4" />
              {t('slide_editors.pick_answer.live_results_updating')}
            </p>
          </div>
          
          <div className={`px-4 py-3 rounded-2xl border border-[#2A2A2A] bg-[#2A2A2A] text-[#6C6C6C] flex flex-col items-start gap-1 min-w-[12rem]`}>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <BarChart2 className="h-4 w-4" />
              <span>{totalResponses} {t('slide_editors.pick_answer.responses')}</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        {console.log('[PickAnswerPresenterView] Passing to PresenterResults:', {
          options: slide.options,
          voteCounts,
          totalResponses
        })}
        <PickAnswerPresenterResults 
          options={slide.options || []} 
          voteCounts={voteCounts} 
          totalResponses={totalResponses} 
        />
      </div>
    </div>
  );
};

export default PickAnswerPresenterView;