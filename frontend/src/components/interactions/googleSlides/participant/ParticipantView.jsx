import React from 'react';

const GoogleSlidesParticipantView = ({ slide, isPreview = false }) => {
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
                title="Google Slides Presentation"
                className="w-full h-full"
                frameBorder="0"
                allowFullScreen
                allow="autoplay; encrypted-media"
              />
            </div>
          ) : (
            <div className="aspect-video bg-[#1F1F1F] rounded-xl overflow-hidden border border-[#3B3B3B] shadow-lg">
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-900/20 to-indigo-900/20">
                <div className="text-center p-6">
                  <div className="mx-auto w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Google Slides Presentation</h3>
                  <p className="text-gray-300 mb-4">No presentation URL configured</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleSlidesParticipantView;