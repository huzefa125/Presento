import { useState, useEffect } from 'react';
import { Video, Link, X } from 'lucide-react';
import SlideTypeHeader from '../common/SlideTypeHeader';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const VideoEditor = ({ slide, onUpdate }) => {
  const { t } = useTranslation();
  const [question, setQuestion] = useState(slide?.question || '');
  const [videoUrl, setVideoUrl] = useState(slide?.videoUrl || '');
  const [videoPublicId, setVideoPublicId] = useState(slide?.videoPublicId || '');

  useEffect(() => {
    if (slide) {
      setQuestion(slide.question || '');
      setVideoUrl(slide.videoUrl || '');
      setVideoPublicId(slide.videoPublicId || '');
    }
  }, [slide]);


  const handleQuestionChange = (value) => {
    setQuestion(value);
    onUpdate({ ...slide, question: value });
  };

  const handleVideoUrlChange = (value) => {
    setVideoUrl(value);
    onUpdate({ ...slide, videoUrl: value });
  };

  // Extract video ID from YouTube URL for preview
  const getYoutubeEmbedUrl = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : null;
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  // Check if URL is a valid video URL
  const isValidVideoUrl = (url) => {
    return url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com');
  };

  // Clean Cloudinary URL by removing transformation parameters that might cause 400 errors
  const cleanCloudinaryUrl = (url) => {
    if (!url || !url.includes('cloudinary.com')) {
      return url;
    }
    
    // If URL contains transformation parameters and it's a video URL, try to get the base URL
    // Pattern: https://res.cloudinary.com/cloud_name/video/upload/transformations/v1234567/folder/file.ext
    const cloudinaryVideoPattern = /(https:\/\/res\.cloudinary\.com\/[^\/]+\/video\/upload\/)([^\/]+\/)(v\d+\/.*)/;
    const match = url.match(cloudinaryVideoPattern);
    
    if (match) {
      // Reconstruct URL without transformation parameters
      // Format: https://res.cloudinary.com/cloud_name/video/upload/v1234567/folder/file.ext
      return `${match[1]}${match[3]}`;
    }
    
    // If pattern doesn't match, return original URL
    return url;
  };


  const handleRemoveVideo = () => {
    setVideoUrl('');
    setVideoPublicId('');
    onUpdate({ 
      ...slide, 
      videoUrl: '',
      videoPublicId: null
    });
  };

  return (
    <div 
      className="h-full overflow-y-auto scrollbar-thin bg-[#1F1F1F] text-[#E0E0E0]"
    >
      <SlideTypeHeader type="video" />

      <div className="p-4 border-b border-[#2A2A2A]">
        <label className="block text-sm font-medium text-[#E0E0E0] mb-2">
          {t('slide_editors.video.title_label')}
        </label>
        <input
          type="text"
          value={question}
          onChange={(e) => handleQuestionChange(e.target.value)}
          className="w-full px-3 py-2 border border-[#2A2A2A] rounded-lg text-sm bg-[#232323] text-[#E0E0E0] placeholder-[#8A8A8A] focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent outline-none"
          placeholder={t('slide_editors.video.title_placeholder')}
        />
      </div>

      <div className="p-4 border-b border-[#2A2A2A]">
        <label className="block text-sm font-medium text-[#E0E0E0] mb-2">
          {t('slide_editors.video.video_label')}
        </label>
        
        {videoUrl ? (
          <div className="space-y-3">
            <div className="relative">
              {isValidVideoUrl(videoUrl) ? (
                <div className="rounded-lg overflow-hidden border border-[#2A2A2A] bg-[#232323]">
                  <div className="aspect-video bg-black flex items-center justify-center">
                    <iframe
                      src={getYoutubeEmbedUrl(videoUrl)}
                      title={t('slide_editors.video.preview_title')}
                      className="w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-lg overflow-hidden border border-[#2A2A2A] bg-[#232323]">
                  <div className="aspect-video bg-black flex items-center justify-center">
                    <video
                      src={cleanCloudinaryUrl(videoUrl)}
                      controls
                      className="w-full h-full"
                      onError={(e) => {
                        // If video fails to load, try the original URL
                        const cleanedUrl = cleanCloudinaryUrl(videoUrl);
                        if (e.target.src !== videoUrl && cleanedUrl !== videoUrl) {
                          e.target.src = videoUrl;
                        } else {
                          toast.error(t('slide_editors.video.video_load_error'));
                        }
                      }}
                    >
                      {t('slide_editors.video.video_not_supported')}
                    </video>
                  </div>
                </div>
              )}
              <button
                onClick={handleRemoveVideo}
                className="absolute top-2 right-2 p-1.5 bg-[#EF5350] rounded-full hover:bg-[#E53935] transition-colors"
                title={t('slide_editors.video.remove_video_title')}
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-[#2A2A2A] rounded-lg p-6 bg-[#232323]">
            <div className="flex items-center justify-center mb-3">
              <Link className="h-10 w-10 text-[#9E9E9E]" />
            </div>
            <p className="text-sm text-[#9E9E9E] mb-3 text-center">{t('slide_editors.video.url_prompt')}</p>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Link className="h-4 w-4 text-[#9E9E9E]" />
              </div>
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => handleVideoUrlChange(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-[#2A2A2A] rounded-lg text-sm bg-[#1F1F1F] text-[#E0E0E0] placeholder-[#8A8A8A] focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent outline-none"
                placeholder={t('slide_editors.video.url_placeholder', { 
                  youtube: t('slide_editors.video.youtube_label'),
                  video: t('slide_editors.video.video_label')
                })}
              />
            </div>
            <p className="text-xs text-[#7E7E7E] mt-2 text-center">{t('slide_editors.video.url_hint', { 
              youtube: t('slide_editors.video.youtube_label'),
              video: t('slide_editors.video.video_label')
            })}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoEditor;