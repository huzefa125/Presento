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
        <div className="bg-surface rounded-lg p-6 border border-hairline">
          <h3 className="text-xl font-semibold text-ink mb-4">{slide.question || t('slide_editors.text.default_title')}</h3>

          <div className="prose max-w-none">
            <div className="text-ink-secondary whitespace-pre-wrap">
              {slide.textContent || t('slide_editors.text.default_content')}
            </div>
          </div>
        </div>

        {responses.length > 0 && (
          <div className="bg-surface rounded-lg p-6 border border-hairline">
            <h3 className="text-xl font-semibold text-ink mb-4">{t('slide_editors.text.participant_responses')}</h3>
            <div className="space-y-4">
              {responses.map((response, index) => (
                <div key={response.id || index} className="p-4 bg-canvas-soft rounded-lg border border-hairline">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-accent-teal">{response.participantName || t('slide_editors.text.anonymous')}</span>
                    <span className="text-xs text-ink-faint">
                      {response.submittedAt ? new Date(response.submittedAt).toLocaleString() : ''}
                    </span>
                  </div>
                  <p className="text-ink-secondary">{response.text || response.answer || t('slide_editors.text.no_response_content')}</p>
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