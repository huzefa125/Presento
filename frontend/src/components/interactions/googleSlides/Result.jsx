import React from 'react';

const GoogleSlidesResult = ({ slide, data }) => {
  const totalResponses = data?.totalResponses || 0;
  
  return (
    <div className="space-y-6">
      <div className="bg-surface rounded-lg p-6 border border-hairline">
        <h3 className="text-xl font-semibold text-ink mb-4">Google Slides Presentation</h3>

        <div className="mb-6">
          <h4 className="text-lg font-medium text-ink-secondary mb-2">Question/Instruction</h4>
          <p className="text-ink-muted">
            {typeof slide.question === 'string'
              ? slide.question
              : (slide.question?.text || slide.question?.label || '')}
          </p>
        </div>

        <div className="mb-6">
          <h4 className="text-lg font-medium text-ink-secondary mb-2">Presentation</h4>
          <div className="aspect-video bg-canvas-soft rounded-lg flex items-center justify-center border border-hairline">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-on-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-ink-muted">Google Slides Presentation</p>
              <p className="text-sm text-ink-faint mt-1">Participants viewed the presentation</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-canvas-soft p-4 rounded-lg border border-hairline">
            <div className="text-2xl font-bold text-accent-teal">{totalResponses}</div>
            <div className="text-sm text-ink-muted">Views</div>
          </div>
          <div className="bg-canvas-soft p-4 rounded-lg border border-hairline">
            <div className="text-2xl font-bold text-primary">Google Slides</div>
            <div className="text-sm text-ink-muted">Platform</div>
          </div>
          <div className="bg-canvas-soft p-4 rounded-lg border border-hairline">
            <div className="text-2xl font-bold text-accent-green">Online</div>
            <div className="text-sm text-ink-muted">Access Method</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleSlidesResult;