import React, { useState, useEffect, useMemo } from 'react';

const PowerPointParticipantView = ({ slide, isPreview = false }) => {
  const powerpointUrl = slide?.powerpointUrl;
  const powerpointPublicId = slide?.powerpointPublicId;
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if it's an uploaded file (has publicId)
  const isUploadedFile = !!powerpointPublicId;
  
  // Calculate embed URL and method using useMemo to avoid infinite loops
  const { embedUrl, viewerUrl, initialEmbedMethod } = useMemo(() => {
    if (!powerpointUrl || !powerpointUrl.trim()) {
      return { embedUrl: null, viewerUrl: null, initialEmbedMethod: 'direct' };
    }
    
    const trimmedUrl = powerpointUrl.trim();
    
    // Don't try to embed blob URLs - they're temporary and won't work
    if (trimmedUrl.startsWith('blob:')) {
      return { embedUrl: null, viewerUrl: null, initialEmbedMethod: 'direct' };
    }
    
    // Ensure URL is properly formatted (HTTPS)
    let urlToEncode = trimmedUrl;
    if (!urlToEncode.startsWith('http://') && !urlToEncode.startsWith('https://')) {
      urlToEncode = `https://${urlToEncode}`;
    }
    
    // Check for known embeddable URL patterns
    const isKnownEmbeddableUrl = (
      trimmedUrl.includes('onedrive.live.com/embed') ||
      trimmedUrl.includes('office.com/embed') ||
      trimmedUrl.includes('sharepoint.com/embed') ||
      trimmedUrl.includes('view.officeapps.live.com') ||
      trimmedUrl.includes('docs.google.com/presentation') ||
      trimmedUrl.includes('slideshare.net') ||
      trimmedUrl.includes('prezi.com')
    );
    
    // Check if it's a direct file URL (.ppt, .pptx) or Cloudinary URL
    const isDirectFileUrl = (
      trimmedUrl.toLowerCase().endsWith('.ppt') ||
      trimmedUrl.toLowerCase().endsWith('.pptx') ||
      trimmedUrl.includes('/file/') ||
      trimmedUrl.includes('/download') ||
      trimmedUrl.includes('cloudinary.com') ||
      trimmedUrl.includes('res.cloudinary.com')
    );
    
    // Calculate viewer URL
    const encodedUrl = encodeURIComponent(urlToEncode);
    const viewerUrl = `https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`;
    
    // Strategy 1: If it's a known embeddable URL, use it directly
    if (isKnownEmbeddableUrl) {
      return { embedUrl: trimmedUrl, viewerUrl, initialEmbedMethod: 'direct' };
    }
    
    // Strategy 2: If it's a direct file URL (including Cloudinary), use Google Docs Viewer
    // Direct file URLs will trigger downloads in iframes, so we must use a viewer
    if (isDirectFileUrl) {
      return { embedUrl: viewerUrl, viewerUrl, initialEmbedMethod: 'viewer' };
    }
    
    // Strategy 3: Try direct embedding first (many services support iframe)
    // Remove hash fragments that might interfere
    const urlWithoutHash = trimmedUrl.split('#')[0];
    return { embedUrl: urlWithoutHash, viewerUrl, initialEmbedMethod: 'direct' };
  }, [powerpointUrl]);

  const [embedMethod, setEmbedMethod] = useState(initialEmbedMethod);
  const [currentEmbedUrl, setCurrentEmbedUrl] = useState(embedUrl);
  const [triedViewer, setTriedViewer] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  
  // Update embed method and current URL when embedUrl changes
  useEffect(() => {
    setEmbedMethod(initialEmbedMethod);
    setCurrentEmbedUrl(embedUrl);
    setTriedViewer(false);
    setIframeError(false);
  }, [embedUrl, initialEmbedMethod]);

  // Reset loading state when URL changes
  useEffect(() => {
    if (currentEmbedUrl) {
      setIsLoading(true);
      
      // Set a timeout to hide loading after a reasonable time
      // Google Docs Viewer can take time to load, but we'll hide loading after 8 seconds
      // This ensures content is visible even if onLoad doesn't fire
      const loadingTimeout = setTimeout(() => {
        setIsLoading(false);
      }, 8000);
      
      return () => clearTimeout(loadingTimeout);
    } else {
      setIsLoading(false);
    }
  }, [currentEmbedUrl]);

  // Handle iframe load error - try fallback methods
  const handleIframeError = () => {
    // If we haven't tried the viewer yet and we're using direct embedding, try viewer
    if (!triedViewer && embedMethod === 'direct' && viewerUrl && embedUrl !== viewerUrl) {
      setTriedViewer(true);
      setCurrentEmbedUrl(viewerUrl);
      setEmbedMethod('viewer');
      setIsLoading(true);
      setIframeError(false);
    } else {
      // Both methods failed, show error
      setIframeError(true);
      setIsLoading(false);
    }
  };

  // Handle iframe load success
  const handleIframeLoad = (e) => {
    // Add delay to ensure content is rendered
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

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
          
          {powerpointUrl && !powerpointUrl.trim().startsWith('blob:') ? (
            currentEmbedUrl ? (
              <div className="w-full bg-[#1F1F1F] rounded-xl overflow-hidden border border-[#3B3B3B] shadow-lg relative" style={{ minHeight: '600px', height: '80vh' }}>
                {/* Loading overlay */}
                {isLoading && (
                  <div className="absolute inset-0 bg-[#1F1F1F] flex items-center justify-center z-10">
                    <div className="text-center p-6">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#4CAF50] mb-4"></div>
                      <p className="text-[#E0E0E0]">Loading presentation...</p>
                    </div>
                  </div>
                )}
                <iframe 
                  key={currentEmbedUrl} // Force re-render when URL changes
                  src={currentEmbedUrl}
                  title="PowerPoint Presentation"
                  className="w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                  allow="autoplay; encrypted-media; fullscreen"
                  onError={handleIframeError}
                  onLoad={handleIframeLoad}
                  sandbox={embedMethod === 'direct' ? "allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation" : "allow-scripts allow-same-origin allow-popups allow-forms"}
                  style={{ 
                    minHeight: '600px', 
                    opacity: isLoading ? 0.3 : 1, 
                    transition: 'opacity 0.5s ease-in-out',
                    visibility: isLoading ? 'visible' : 'visible'
                  }}
                />
                {/* Error overlay that appears if iframe fails */}
                {iframeError && (
                  <div className="absolute inset-0 bg-[#1F1F1F] flex items-center justify-center z-10">
                    <div className="text-center p-6 max-w-md">
                      <div className="mx-auto w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-yellow-400 mb-2 text-lg font-semibold">Unable to embed presentation</p>
                      <p className="text-gray-300 mb-6 text-sm">
                        This presentation URL cannot be embedded directly. Please open it in a new tab for the best viewing experience.
                      </p>
                      <a 
                        href={powerpointUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition text-sm"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                          <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                        </svg>
                        Open in new tab
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Fallback UI when no embed method works
              <div className="w-full bg-[#1F1F1F] rounded-xl overflow-hidden border border-[#3B3B3B] shadow-lg relative" style={{ minHeight: '600px', height: '80vh' }}>
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-orange-900/20 to-red-900/20 p-8">
                  <div className="text-center max-w-2xl">
                    <div className="mx-auto w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mb-6">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-semibold text-white mb-4">PowerPoint Presentation</h3>
                    <p className="text-gray-300 mb-6 text-lg">
                      This presentation cannot be embedded directly. For the best viewing experience, please open it in a new tab.
                    </p>
                    <a 
                      href={powerpointUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition duration-200 text-lg shadow-lg hover:shadow-xl"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                      </svg>
                      Open Presentation in New Tab
                    </a>
                    <p className="text-gray-400 text-sm mt-4">
                      The presentation will open in a new window.
                    </p>
                  </div>
                </div>
              </div>
            )
          ) : powerpointUrl && powerpointUrl.trim().startsWith('blob:') ? (
            <div className="aspect-video bg-[#1F1F1F] rounded-xl overflow-hidden border border-[#3B3B3B] shadow-lg">
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-orange-900/20 to-red-900/20">
                <div className="text-center p-6">
                  <div className="mx-auto w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">PowerPoint Presentation</h3>
                  <p className="text-yellow-400 mb-2">⚠️ Temporary file detected</p>
                  <p className="text-gray-300 mb-4">The presentation is being processed. Please wait...</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="aspect-video bg-[#1F1F1F] rounded-xl overflow-hidden border border-[#3B3B3B] shadow-lg">
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-orange-900/20 to-red-900/20">
                <div className="text-center p-6">
                  <div className="mx-auto w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">PowerPoint Presentation</h3>
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

export default PowerPointParticipantView;