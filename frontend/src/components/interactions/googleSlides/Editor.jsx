import React, { useState, useEffect, useRef } from 'react';
import SlideTypeHeader from '../common/SlideTypeHeader';
import { useTranslation } from 'react-i18next';

const GoogleSlidesEditor = ({ slide, onUpdate }) => {
  const { t } = useTranslation();
  const [question, setQuestion] = useState(slide?.question || '');
  const [googleSlidesUrl, setGoogleSlidesUrl] = useState(slide?.googleSlidesUrl || '');
  const isMounted = useRef(false);

  // Sync state when slide prop changes
  useEffect(() => {
    if (slide) {
      setQuestion(slide.question || '');
      setGoogleSlidesUrl(slide.googleSlidesUrl || '');
    }
  }, [slide?.id, slide?.question, slide?.googleSlidesUrl]);

  useEffect(() => {
    // Skip the first render to avoid infinite loop
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    
    // Update parent component when state changes
    onUpdate({
      question: question.trim(),
      googleSlidesUrl: googleSlidesUrl.trim()
    });
  }, [question, googleSlidesUrl, onUpdate]);

  return (
    <div className="h-full overflow-y-auto scrollbar-thin bg-canvas text-ink">
      <SlideTypeHeader type="google_slides" />

      <div className="p-4 border-b border-hairline">
        <label className="block text-sm font-medium text-ink-secondary mb-2">
          {t('slide_editors.google_slides.question_label')}
        </label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t('slide_editors.google_slides.question_placeholder')}
          className="w-full px-3 py-2 bg-surface border border-hairline rounded-md text-ink placeholder:text-ink-faint focus:outline-none focus:shadow-[var(--shadow-level-1)] focus:border-primary transition-shadow resize-none"
          rows="3"
        />
      </div>

      <div className="p-4 border-b border-hairline">
        <label className="block text-sm font-medium text-ink-secondary mb-2">
          {t('slide_editors.google_slides.url_label')}
        </label>
        <input
          type="url"
          value={googleSlidesUrl}
          onChange={(e) => setGoogleSlidesUrl(e.target.value)}
          placeholder={t('slide_editors.google_slides.url_placeholder')}
          className="w-full px-3 py-2 bg-surface border border-hairline rounded-md text-ink placeholder:text-ink-faint focus:outline-none focus:shadow-[var(--shadow-level-1)] focus:border-primary transition-shadow"
        />
        <p className="mt-1 text-xs text-ink-faint">
          {t('slide_editors.google_slides.url_description')}
        </p>
      </div>

      {googleSlidesUrl && (() => {
        // Validate URL before attempting to embed
        const trimmedUrl = googleSlidesUrl.trim();
        const isValidSlidesUrl = trimmedUrl.includes('docs.google.com/presentation/');
        const isDriveUrl = trimmedUrl.includes('drive.google.com') && !trimmedUrl.includes('/presentation/');

        if (isDriveUrl) {
          return (
            <div className="p-4 border-b border-hairline">
              <div className="bg-accent-orange/10 border border-accent-orange/40 rounded-md p-3">
                <p className="text-accent-orange-deep text-sm">
                  ⚠️ Google Drive URLs cannot be embedded. Please use a Google Slides share URL (docs.google.com/presentation/...)
                </p>
              </div>
            </div>
          );
        }

        if (!isValidSlidesUrl) {
          return (
            <div className="p-4 border-b border-hairline">
              <div className="bg-red-50 border border-red-300 rounded-md p-3">
                <p className="text-red-600 text-sm">
                  ⚠️ Invalid Google Slides URL. Must be a docs.google.com/presentation/ URL.
                </p>
              </div>
            </div>
          );
        }

        // Clean URL for embedding
        let embedUrl = trimmedUrl.replace('/edit', '/embed').replace('/view', '/embed');
        embedUrl = embedUrl.split('?')[0];
        embedUrl = `${embedUrl}?start=false&loop=false&delayms=3000`;

        return (
          <div className="p-4 border-b border-hairline">
            <h4 className="text-sm font-medium text-ink-secondary mb-2">{t('slide_editors.google_slides.preview_title')}</h4>
            <div className="aspect-video bg-canvas-soft rounded overflow-hidden">
              <iframe
                src={embedUrl}
                title={t('slide_editors.google_slides.preview_title')}
                className="w-full h-full"
                frameBorder="0"
                allowFullScreen
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              ></iframe>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default GoogleSlidesEditor;