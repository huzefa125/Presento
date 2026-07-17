import React from 'react';

const MiroParticipantView = ({ slide, isPreview = false }) => {
  // Convert Miro URL to embed format
  const getEmbedUrl = (url) => {
    if (!url) return null;
    // If already an embed URL, return as is
    if (url.includes('/embed')) return url;
    // Extract board ID from Miro URL and create embed URL
    const boardIdMatch = url.match(/board\/([^\/\?]+)/);
    if (boardIdMatch) {
      return `https://miro.com/app/live-embed/${boardIdMatch[1]}/?autoplay=true`;
    }
    return null;
  };

  const embedUrl = getEmbedUrl(slide?.miroUrl);
  const miroUrl = slide?.miroUrl;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-6xl">
          {slide?.question && (
            <h2 className="text-2xl font-bold text-white mb-4 text-center">
              {typeof slide.question === 'string' 
                ? slide.question 
                : (slide.question?.text || slide.question?.label || '')}
            </h2>
          )}
          
          {embedUrl ? (
            <div className="aspect-video bg-[#1F1F1F] rounded-xl overflow-hidden border border-[#3B3B3B] shadow-lg">
              <iframe 
                src={embedUrl}
                title="Miro Board"
                className="w-full h-full"
                frameBorder="0"
                allowFullScreen
                allow="clipboard-read; clipboard-write"
              />
            </div>
          ) : miroUrl ? (
            <div className="aspect-video bg-[#1F1F1F] rounded-xl overflow-hidden border border-[#3B3B3B] shadow-lg">
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-900/20 to-blue-900/20">
                <div className="text-center p-6">
                  <div className="mx-auto w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Miro Board Interaction</h3>
                  <p className="text-gray-300 mb-4">Click below to open the Miro board in a new tab</p>
                  <a 
                    href={miroUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition duration-200"
                  >
                    Open Miro Board
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="aspect-video bg-[#1F1F1F] rounded-xl overflow-hidden border border-[#3B3B3B] shadow-lg">
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-900/20 to-blue-900/20">
                <div className="text-center p-6">
                  <div className="mx-auto w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Miro Board Interaction</h3>
                  <p className="text-gray-300 mb-4">No Miro board URL configured</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MiroParticipantView;