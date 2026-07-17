import React from 'react';
import ResultCard from './ResultCard';
import { useTranslation } from 'react-i18next';

const MiroResult = ({ slide, data }) => {
  const { t } = useTranslation();
  const { responses = [] } = data;
  
  return (
    <ResultCard 
      slide={slide}
      totalResponses={responses.length}
    >
      <div className="space-y-6">
        <div className="bg-surface rounded-lg p-6 border border-hairline">
          <h3 className="text-xl font-semibold text-ink mb-4">
            {typeof slide.question === 'string'
              ? slide.question
              : (slide.question?.text || slide.question?.label || t('slide_editors.miro.default_title'))}
          </h3>

          <div className="mb-6">
            <h4 className="text-lg font-medium text-ink-secondary mb-2">{t('slide_editors.miro.question_instruction')}</h4>
            <p className="text-ink-muted">
              {typeof slide.question === 'string'
                ? slide.question
                : (slide.question?.text || slide.question?.label || '')}
            </p>
          </div>

          <div className="mb-6">
            <h4 className="text-lg font-medium text-ink-secondary mb-2">{t('slide_editors.miro.miro_board')}</h4>
            <div className="aspect-video bg-canvas-soft rounded-lg flex items-center justify-center border border-hairline">
              <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-accent-purple-deep rounded-full flex items-center justify-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-on-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <p className="text-ink-muted">{t('slide_editors.miro.board_embedded')}</p>
                <p className="text-sm text-ink-faint mt-1">{t('slide_editors.miro.board_interaction')}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-canvas-soft p-4 rounded-lg border border-hairline">
              <div className="text-2xl font-bold text-accent-teal">{responses.length}</div>
              <div className="text-sm text-ink-muted">{t('slide_editors.miro.total_interactions')}</div>
            </div>
            <div className="bg-canvas-soft p-4 rounded-lg border border-hairline">
              <div className="text-2xl font-bold text-accent-sky">{t('slide_editors.miro.board_type')}</div>
              <div className="text-sm text-ink-muted">{t('slide_editors.miro.board_type_label')}</div>
            </div>
            <div className="bg-canvas-soft p-4 rounded-lg border border-hairline">
              <div className="text-2xl font-bold text-accent-purple-deep">{t('slide_editors.miro.interaction_mode')}</div>
              <div className="text-sm text-ink-muted">{t('slide_editors.miro.interaction_mode_label')}</div>
            </div>
          </div>
        </div>
      </div>
    </ResultCard>
  );
};

export default MiroResult;