import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import SlideTypeHeader from '../common/SlideTypeHeader';
import { useTranslation } from 'react-i18next';

const PowerPointEditor = ({ slide, onUpdate }) => {
  const { t } = useTranslation();
  const [question, setQuestion] = useState(slide?.question || '');
  const [powerpointUrl, setPowerpointUrl] = useState(slide?.powerpointUrl || '');
  const [powerpointPublicId, setPowerpointPublicId] = useState(slide?.powerpointPublicId || '');
  const isMounted = useRef(false);

  useEffect(() => {
    if (slide) {
      setQuestion(slide.question || '');
      setPowerpointUrl(slide.powerpointUrl || '');
      setPowerpointPublicId(slide.powerpointPublicId || '');
    }
  }, [slide]);

  useEffect(() => {
    // Skip the first render to avoid infinite loop
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    
    // Update parent component when state changes
    // Don't trim question during typing to preserve spaces between words
    // Only trim URLs to remove accidental whitespace
    onUpdate({
      question: question,
      powerpointUrl: powerpointUrl.trim(),
      powerpointPublicId: powerpointPublicId
    });
  }, [question, powerpointUrl, powerpointPublicId, onUpdate]);

  const handleRemovePowerPoint = () => {
    setPowerpointUrl('');
    setPowerpointPublicId('');
    onUpdate({
      question: question,
      powerpointUrl: '',
      powerpointPublicId: ''
    });
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin bg-[#1F1F1F] text-[#E0E0E0]">
      <SlideTypeHeader type="powerpoint" />
      
      <div className="p-4 border-b border-[#2A2A2A]">
        <label className="block text-sm font-medium text-[#E0E0E0] mb-2">
          {t('slide_editors.powerpoint.question_label')}
        </label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            // Explicitly allow space key - prevent any parent handlers from interfering
            if (e.key === ' ') {
              e.stopPropagation();
            }
          }}
          placeholder={t('slide_editors.powerpoint.question_placeholder')}
          className="w-full px-3 py-2 bg-[#2A2A2A] border border-[#3B3B3B] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
          rows="3"
        />
      </div>

      <div className="p-4 border-b border-[#2A2A2A]">
        <label className="block text-sm font-medium text-[#E0E0E0] mb-3">
          {t('slide_editors.powerpoint.url_label')}
        </label>
        
        {powerpointUrl && powerpointPublicId ? (
          // Show existing uploaded file (if any) with option to remove
          <div className="relative rounded-lg overflow-hidden border border-[#2A2A2A] bg-[#232323] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#E0E0E0]">
                    {t('slide_editors.powerpoint.file_uploaded')}
                  </p>
                  <p className="text-xs text-[#9E9E9E]">
                    {t('slide_editors.powerpoint.uploaded_successfully')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemovePowerPoint}
                className="p-1.5 bg-[#EF5350] hover:bg-[#E53935] text-white rounded-full transition-colors"
                title={t('slide_editors.powerpoint.remove_file_title')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          // URL input field
          <>
            <input
              type="url"
              value={powerpointUrl}
              onChange={(e) => setPowerpointUrl(e.target.value)}
              placeholder={t('slide_editors.powerpoint.url_placeholder')}
              className="w-full px-3 py-2 bg-[#2A2A2A] border border-[#3B3B3B] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              {t('slide_editors.powerpoint.url_description')}
            </p>
          </>
        )}
      </div>

      {powerpointUrl && !powerpointUrl.trim().startsWith('blob:') && (
        <div className="p-4 border-b border-[#2A2A2A]">
          <h4 className="text-sm font-medium text-gray-300 mb-2">{t('slide_editors.powerpoint.preview_title')}</h4>
          <div className="aspect-video bg-[#1F1F1F] rounded overflow-hidden flex items-center justify-center">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-300 mb-2">{t('slide_editors.powerpoint.presentation_label')}</p>
              <a 
                href={powerpointUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition duration-200"
              >
                {t('slide_editors.powerpoint.view_presentation')}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}
      {powerpointUrl && powerpointUrl.trim().startsWith('blob:') && (
        <div className="p-4 border-b border-[#2A2A2A]">
          <div className="bg-yellow-900/20 border border-yellow-600 rounded-md p-3">
            <p className="text-yellow-400 text-sm">
              ⚠️ {t('slide_editors.powerpoint.upload_success')} Please save the slide to finalize the upload.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PowerPointEditor;