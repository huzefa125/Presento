import React from 'react';

const GoogleSlidesPresenterView = ({ slide, responses = [] }) => {
  // Convert Google Slides URL to embed format
  const getEmbedUrl = (url) => {
    if (!url) return null;
    
    // Validate that it's a Google Slides URL, not a Google Drive URL
    const trimmedUrl = url.trim();
    
    // Reject Google Drive URLs (they can't be embedded due to CSP)
    if (trimmedUrl.includes('drive.google.com') && !trimmedUrl.includes('/presentation/')) {
      console.warn('Google Drive URLs cannot be embedded. Please use a Google Slides share URL instead.');
      return null;
    }
    
    // Must be a Google Slides URL (docs.google.com/presentation/)
    if (!trimmedUrl.includes('docs.google.com/presentation/')) {
      console.warn('Invalid Google Slides URL. Must be a docs.google.com/presentation/ URL.');
      return null;
    }
    
    // If already an embed URL, clean it up
    if (trimmedUrl.includes('/embed')) {
      // Remove any existing query parameters and add our own
      const baseUrl = trimmedUrl.split('?')[0];
      return `${baseUrl}?start=false&loop=false&delayms=3000`;
    }
    
    // Convert edit/view URL to embed URL
    let embedUrl = trimmedUrl.replace('/edit', '/embed').replace('/view', '/embed');
    // Remove any existing query parameters
    embedUrl = embedUrl.split('?')[0];
    // Add our query parameters
    return `${embedUrl}?start=false&loop=false&delayms=3000`;
  };

  const embedUrl = getEmbedUrl(slide?.googleSlidesUrl);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow flex flex-col items-center justify-center p-2 sm:p-3 md:p-4">
        <div className="w-full max-w-6xl px-2 sm:px-4">
          {slide?.question && (
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-3 sm:mb-4 text-center px-2">
              {typeof slide.question === 'string' 
                ? slide.question 
                : (slide.question?.text || slide.question?.label || '')}
            </h2>
          )}
          
          {embedUrl ? (
            <div className="aspect-video bg-[#1F1F1F] rounded-lg sm:rounded-xl overflow-hidden border border-[#3B3B3B] shadow-lg">
              <iframe 
                src={embedUrl}
                title="Google Slides Presentation"
                className="w-full h-full"
                frameBorder="0"
                allowFullScreen
                allow="autoplay; encrypted-media"
              />
            </div>
          ) : (
            <div className="aspect-video bg-[#1F1F1F] rounded-lg sm:rounded-xl overflow-hidden border border-[#3B3B3B] shadow-lg">
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-900/20 to-indigo-900/20">
                <div className="text-center p-4 sm:p-6">
                  <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-blue-500 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Google Slides Presentation</h3>
                  <p className="text-sm sm:text-base text-gray-300 mb-4">No presentation URL configured</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#1A1A1A] border-t border-[#3B3B3B] p-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-400">
            Participants are viewing the Google Slides presentation
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-teal-500 rounded-full mr-2"></div>
              <span className="text-white font-medium">{responses.length}</span>
              <span className="text-gray-400 ml-1">views</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleSlidesPresenterView;