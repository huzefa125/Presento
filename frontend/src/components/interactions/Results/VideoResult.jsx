import React from 'react';
import ResultCard from './ResultCard';
import { useTranslation } from 'react-i18next';

const VideoResult = ({ slide, data }) => {
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
              : (slide.question?.text || slide.question?.label || t('slide_editors.video.default_title'))}
          </h3>

          {slide.videoUrl ? (
            <div className="flex justify-center">
              <div className="relative w-full max-w-3xl aspect-video bg-canvas-soft rounded-lg overflow-hidden border border-hairline flex items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-accent-pink rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-on-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-ink-muted mb-2">{t('slide_editors.video.video_content')}</p>
                  <p className="text-sm text-ink-faint">{t('slide_editors.video.video_url')}: {slide.videoUrl}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 bg-canvas-soft rounded-lg border-2 border-dashed border-hairline">
              <div className="text-ink-faint mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-ink-faint text-center">{t('slide_editors.video.no_video')}</p>
            </div>
          )}
        </div>

        {responses.length > 0 && (
          <div className="bg-surface rounded-lg p-6 border border-hairline">
            <h3 className="text-xl font-semibold text-ink mb-4">{t('slide_editors.video.participant_responses')}</h3>
            <div className="space-y-4">
              {responses.map((response, index) => (
                <div key={response.id || index} className="p-4 bg-canvas-soft rounded-lg border border-hairline">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-accent-teal">{response.participantName || t('slide_editors.video.anonymous')}</span>
                    <span className="text-xs text-ink-faint">
                      {response.submittedAt ? new Date(response.submittedAt).toLocaleString() : ''}
                    </span>
                  </div>
                  <p className="text-ink-secondary">{response.text || response.answer || t('slide_editors.video.no_response_content')}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ResultCard>
  );
};

export default VideoResult;