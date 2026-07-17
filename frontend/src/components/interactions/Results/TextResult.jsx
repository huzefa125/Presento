import React from 'react';
import ResultCard from './ResultCard';
import { useTranslation } from 'react-i18next';

const TextResult = ({ slide, data }) => {
  const { t } = useTranslation();
  const { responses = [] } = data;
  
  return (
    <ResultCard 
      slide={slide}
      totalResponses={responses.length}
    >
      <div className="space-y-6">
        <div className="bg-[#1F1F1F] rounded-lg p-6 border border-[#2A2A2A]">
          <h3 className="text-xl font-semibold text-white mb-4">{slide.question || t('slide_editors.text.default_title')}</h3>
          
          <div className="prose prose-invert max-w-none">
            <div className="text-gray-300 whitespace-pre-wrap">
              {slide.textContent || t('slide_editors.text.default_content')}
            </div>
          </div>
        </div>
        
        {responses.length > 0 && (
          <div className="bg-[#1F1F1F] rounded-lg p-6 border border-[#2A2A2A]">
            <h3 className="text-xl font-semibold text-white mb-4">{t('slide_editors.text.participant_responses')}</h3>
            <div className="space-y-4">
              {responses.map((response, index) => (
                <div key={response.id || index} className="p-4 bg-[#2A2A2A] rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-teal-400">{response.participantName || t('slide_editors.text.anonymous')}</span>
                    <span className="text-xs text-gray-500">
                      {response.submittedAt ? new Date(response.submittedAt).toLocaleString() : ''}
                    </span>
                  </div>
                  <p className="text-gray-300">{response.text || response.answer || t('slide_editors.text.no_response_content')}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ResultCard>
  );
};

export default TextResult;