import React from 'react';
import ResultCard from './ResultCard';
import { useTranslation } from 'react-i18next';

const ImageResult = ({ slide, data }) => {
  const { t } = useTranslation();
  const { responses = [] } = data;
  
  // Safely extract question text (handle both string and object formats)
  const questionText = typeof slide.question === 'string' 
    ? slide.question 
    : (slide.question?.text || slide.question?.label || t('slide_editors.image.default_title'));
  
  return (
    <ResultCard 
      slide={slide}
      totalResponses={responses.length}
    >
      <div className="space-y-4 sm:space-y-6">
        <div className="bg-[#1F1F1F] rounded-lg p-4 sm:p-6 border border-[#2A2A2A]">
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">
            {questionText}
          </h3>
          
          {slide.imageUrl ? (
            <div className="flex justify-center">
              <img 
                src={slide.imageUrl} 
                alt={questionText || t('slide_editors.image.alt_text')} 
                className="max-w-full h-auto rounded-lg shadow-lg border border-[#3B3B3B] w-full"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjMkEyQTJBIi8+CjxwYXRoIGQ9Ik0zNi43NSAyMi41SDIzLjI1QzIyLjQyMTcgMjIuNSAyMS43NSAyMy4xNzE2IDIxLjc1IDI0VjM3LjVDMjEuNzUgMzguMzI4NCAyMi40MjE3IDM5IDIzLjI1IDM5SDM2Ljc1QzM3LjU3ODMgMzkgMzguMjUgMzguMzI4NCAzOC4yNSAzNy41VjI0QzM4LjI1IDIzLjE3MTYgMzcuNTc4MyAyMi41IDM2Ljc1IDIyLjVaIiBzdHJva2U9IiM0Q0FGNTAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Ik0yNS41IDI1LjVDMjUuNSAyNi4wNTIzIDI1Ljk0NzcgMjcgMjYuNSAyN0MyNy4wNTIzIDI3IDI3LjUgMjYuMDUyMyAyNy41IDI1LjVDMjcuNSAyNC45NDc3IDI3LjA1MjMgMjQuNSAyNi41IDI0LjVDMjUuOTQ3NyAyNC41IDI1LjUgMjQuOTQ3NyAyNS41IDI1LjVaIiBmaWxsPSIjNENBRjUwIi8+CjxwYXRoIGQ9Ik0yOS41IDMxLjI1TDI3Ljc1IDMzLjI1TDMwLjI1IDM1LjI1TDM0Ljc1IDMwLjc1IiBzdHJva2U9IiM0Q0FGNTAiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+Cg==';
                }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 sm:p-12 bg-[#2A2A2A] rounded-lg border-2 border-dashed border-[#3B3B3B]">
              <div className="text-gray-500 mb-3 sm:mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 sm:h-12 sm:w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-500 text-center text-sm sm:text-base">{t('slide_editors.image.no_image')}</p>
            </div>
          )}
        </div>
        
        {responses.length > 0 && (
          <div className="bg-[#1F1F1F] rounded-lg p-4 sm:p-6 border border-[#2A2A2A]">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">
              {t('slide_editors.image.participant_responses')}
            </h3>
            <div className="space-y-3 sm:space-y-4">
              {responses.map((response, index) => (
                <div key={response.id || index} className="p-3 sm:p-4 bg-[#2A2A2A] rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                    <span className="text-xs sm:text-sm font-medium text-teal-400">
                      {response.participantName || t('slide_editors.image.anonymous')}
                    </span>
                    <span className="text-xs text-gray-500">
                      {response.submittedAt ? new Date(response.submittedAt).toLocaleString() : ''}
                    </span>
                  </div>
                  <p className="text-sm sm:text-base text-gray-300">
                    {response.text || response.answer || t('slide_editors.image.no_response_content')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ResultCard>
  );
};

export default ImageResult;