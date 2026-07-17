import React, { useState, useEffect, useRef } from 'react';
import SlideTypeHeader from '../common/SlideTypeHeader';
import { useTranslation } from 'react-i18next';

const MiroEditor = ({ slide, onUpdate }) => {
  const { t } = useTranslation();
  const [question, setQuestion] = useState(slide?.question || '');
  const [miroUrl, setMiroUrl] = useState(slide?.miroUrl || '');
  const isMounted = useRef(false);

  // Sync state when slide prop changes
  useEffect(() => {
    if (slide) {
      setQuestion(slide.question || '');
      setMiroUrl(slide.miroUrl || '');
    }
  }, [slide?.id, slide?.question, slide?.miroUrl]);

  useEffect(() => {
    // Skip the first render to avoid infinite loop
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    
    // Update parent component when state changes
    onUpdate({
      question: question.trim(),
      miroUrl: miroUrl.trim()
    });
  }, [question, miroUrl, onUpdate]);

  return (
    <div className="h-full overflow-y-auto scrollbar-thin bg-[#1F1F1F] text-[#E0E0E0]">
      <SlideTypeHeader type="miro" />
      
      <div className="p-4 border-b border-[#2A2A2A]">
        <label className="block text-sm font-medium text-[#E0E0E0] mb-2">
          {t('slide_editors.miro.question_label')}
        </label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t('slide_editors.miro.question_placeholder')}
          className="w-full px-3 py-2 bg-[#2A2A2A] border border-[#3B3B3B] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
          rows="3"
        />
      </div>

      <div className="p-4 border-b border-[#2A2A2A]">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {t('slide_editors.miro.url_label')}
        </label>
        <input
          type="url"
          value={miroUrl}
          onChange={(e) => setMiroUrl(e.target.value)}
          placeholder={t('slide_editors.miro.url_placeholder')}
          className="w-full px-3 py-2 bg-[#2A2A2A] border border-[#3B3B3B] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
        <p className="mt-1 text-xs text-gray-500">
          {t('slide_editors.miro.url_description')}
        </p>
      </div>

      {miroUrl && (
        <div className="p-4 border-b border-[#2A2A2A]">
          <h4 className="text-sm font-medium text-gray-300 mb-2">{t('slide_editors.miro.preview_title')}</h4>
          <div className="aspect-video bg-[#1F1F1F] rounded overflow-hidden flex items-center justify-center">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <p className="text-gray-300 mb-2">{t('slide_editors.miro.board_label')}</p>
              <a 
                href={miroUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition duration-200"
              >
                {t('slide_editors.miro.view_board')}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MiroEditor;