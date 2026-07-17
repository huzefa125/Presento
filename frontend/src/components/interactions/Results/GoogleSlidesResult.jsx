import React from 'react';
import ResultCard from './ResultCard';
import { useTranslation } from 'react-i18next';

const GoogleSlidesResult = ({ slide, data }) => {
  const { t } = useTranslation();
  const { responses = [] } = data;
  
  return (
    <ResultCard 
      slide={slide}
      totalResponses={responses.length}
    >
      <div className="space-y-6">
        <div className="bg-[#1F1F1F] rounded-lg p-6 border border-[#2A2A2A]">
          <h3 className="text-xl font-semibold text-white mb-4">
            {typeof slide.question === 'string' 
              ? slide.question 
              : (slide.question?.text || slide.question?.label || t('slide_editors.google_slides.default_title'))}
          </h3>
          
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-300 mb-2">{t('slide_editors.google_slides.question_instruction')}</h4>
            <p className="text-gray-400">
              {typeof slide.question === 'string' 
                ? slide.question 
                : (slide.question?.text || slide.question?.label || '')}
            </p>
          </div>

          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-300 mb-2">{t('slide_editors.google_slides.presentation')}</h4>
            <div className="aspect-video bg-[#2A2A2A] rounded-lg flex items-center justify-center border border-[#3B3B3B]">
              <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-400">{t('slide_editors.google_slides.presentation_title')}</p>
                <p className="text-sm text-gray-500 mt-1">{t('slide_editors.google_slides.presentation_description')}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#242424] p-4 rounded-lg border border-[#3B3B3B]">
              <div className="text-2xl font-bold text-teal-400">{responses.length}</div>
              <div className="text-sm text-gray-400">{t('slide_editors.google_slides.views')}</div>
            </div>
            <div className="bg-[#242424] p-4 rounded-lg border border-[#3B3B3B]">
              <div className="text-2xl font-bold text-blue-400">{t('slide_editors.google_slides.platform')}</div>
              <div className="text-sm text-gray-400">{t('slide_editors.google_slides.platform_label')}</div>
            </div>
            <div className="bg-[#242424] p-4 rounded-lg border border-[#3B3B3B]">
              <div className="text-2xl font-bold text-green-400">{t('slide_editors.google_slides.access_method')}</div>
              <div className="text-sm text-gray-400">{t('slide_editors.google_slides.access_method_label')}</div>
            </div>
          </div>
        </div>
      </div>
    </ResultCard>
  );
};

export default GoogleSlidesResult;