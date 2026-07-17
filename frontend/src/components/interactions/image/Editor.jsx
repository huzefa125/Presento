import { useState, useEffect, useRef, useCallback } from 'react';
import { Image as ImageIcon, Upload, X, Link as LinkIcon } from 'lucide-react';
import SlideTypeHeader from '../common/SlideTypeHeader';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { translateError } from '../../../utils/errorTranslator';
import { uploadImage as uploadImageService } from '../../../services/presentationService';

const ImageEditor = ({ slide, onUpdate }) => {
  const { t } = useTranslation();
  const [question, setQuestion] = useState(slide?.question || '');
  const [imageUrl, setImageUrl] = useState(slide?.imageUrl || '');
  const [imagePublicId, setImagePublicId] = useState(slide?.imagePublicId || '');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMethod, setUploadMethod] = useState('file'); // 'file' or 'url'
  const [urlInput, setUrlInput] = useState('');
  const [isValidatingUrl, setIsValidatingUrl] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dropZoneRef = useRef(null);

  useEffect(() => {
    if (slide) {
      setQuestion(slide.question || '');
      setImageUrl(slide.imageUrl || '');
      setImagePublicId(slide.imagePublicId || '');
      
      // If image exists but no publicId, it's likely a URL-based image
      if (slide.imageUrl && !slide.imagePublicId) {
        setUrlInput(slide.imageUrl);
        setUploadMethod('url');
      } else {
        setUrlInput('');
      }
    }
  }, [slide]);

  // Process image file (used by file input, drag-drop, and paste)
  const processImageFile = useCallback(async (file) => {
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast.error(t('slide_editors.image.upload_image_error'));
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('slide_editors.image.image_size_error'));
      return;
    }

    setIsUploading(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64Image = event.target.result;
          const response = await uploadImageService(base64Image);

          if (response.success) {
            setImageUrl(response.data.imageUrl);
            setImagePublicId(response.data.publicId);
            onUpdate({ 
              ...slide, 
              imageUrl: response.data.imageUrl,
              imagePublicId: response.data.publicId
            });
            toast.success(t('slide_editors.image.upload_success'));
            // Switch to file method after successful upload
            setUploadMethod('file');
          }
        } catch (error) {
          console.error('Upload error:', error);
          const errorMessage = error?.response?.data?.error || error?.message || 'Failed to upload image';
          
          // Special handling for rate limit errors
          if (error?.response?.status === 429) {
            const retryAfter = error?.response?.data?.retryAfter || 'a few minutes';
            toast.error(`Upload limit reached. Please try again after ${retryAfter}.`, {
              duration: 5000
            });
          } else {
            toast.error(translateError(error, t, 'slide_editors.image.upload_failed'));
          }
        } finally {
          setIsUploading(false);
        }
      };
      
      reader.onerror = () => {
        toast.error(t('slide_editors.image.upload_image_error'));
        setIsUploading(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Image processing error:', error);
      toast.error(translateError(error, t, 'slide_editors.image.upload_failed'));
      setIsUploading(false);
    }
  }, [slide, onUpdate, t]);

  // Handle paste event for clipboard images
  useEffect(() => {
    const handlePaste = async (e) => {
      // Only handle paste when the editor is focused/active
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            await processImageFile(file);
          }
          break;
        }
      }
    };

    // Add paste event listener to the document
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [processImageFile]);

  const handleQuestionChange = (value) => {
    setQuestion(value);
    onUpdate({ ...slide, question: value });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    await processImageFile(file);
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the drop zone
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (isUploading) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      await processImageFile(file);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    setImagePublicId('');
    setUrlInput('');
    onUpdate({ 
      ...slide, 
      imageUrl: '',
      imagePublicId: null
    });
  };

  const validateImageUrl = (url) => {
    try {
      const urlObj = new URL(url);
      // Check if URL is http or https
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return false;
      }
      // Check if URL ends with common image extensions or contains image indicators
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'];
      const pathname = urlObj.pathname.toLowerCase();
      const lowerUrl = url.toLowerCase();
      
      // Allow URLs with image extensions
      if (imageExtensions.some(ext => pathname.endsWith(ext))) {
        return true;
      }
      
      // Allow URLs from known image hosting services
      const imageHosts = ['imgur', 'unsplash', 'pexels', 'cloudinary', 'images.unsplash', 
                         'cdn', 'i.imgur', 'pixabay', 'freepik', 'shutterstock'];
      if (imageHosts.some(host => lowerUrl.includes(host))) {
        return true;
      }
      
      // Allow URLs that contain 'image' in path
      if (pathname.includes('image') || lowerUrl.includes('/image/')) {
        return true;
      }
      
      // For other URLs, we'll try to load them and see if they're images
      // This allows more flexibility
      return true;
    } catch {
      return false;
    }
  };

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) {
      toast.error(t('slide_editors.image.url_required'));
      return;
    }

    // Basic URL validation
    if (!validateImageUrl(urlInput.trim())) {
      toast.error(t('slide_editors.image.invalid_url'));
      return;
    }

    setIsValidatingUrl(true);

    try {
      // Test if the URL loads an image
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = () => {
          // Image loaded successfully
          setImageUrl(urlInput.trim());
          setImagePublicId(null); // No publicId for external URLs
          onUpdate({ 
            ...slide, 
            imageUrl: urlInput.trim(),
            imagePublicId: null
          });
          toast.success(t('slide_editors.image.url_added_success'));
          setIsValidatingUrl(false);
          resolve();
        };
        img.onerror = () => {
          setIsValidatingUrl(false);
          reject(new Error('Failed to load image from URL'));
        };
        img.src = urlInput.trim();
      });
    } catch (error) {
      console.error('URL validation error:', error);
      toast.error(t('slide_editors.image.url_load_error'));
      setIsValidatingUrl(false);
    }
  };

  return (
    <div 
      className="h-full overflow-y-auto scrollbar-thin bg-[#1F1F1F] text-[#E0E0E0]"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      ref={dropZoneRef}
    >
      <SlideTypeHeader type="image" />

      <div className="p-4 border-b border-[#2A2A2A]">
        <label className="block text-sm font-medium text-[#E0E0E0] mb-2">
          {t('slide_editors.image.title_label')}
        </label>
        <input
          type="text"
          value={question}
          onChange={(e) => handleQuestionChange(e.target.value)}
          className="w-full px-3 py-2 border border-[#2A2A2A] rounded-lg text-sm bg-[#232323] text-[#E0E0E0] placeholder-[#8A8A8A] focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent outline-none"
          placeholder={t('slide_editors.image.title_placeholder')}
        />
      </div>

      <div className="p-4 border-b border-[#2A2A2A]">
        <label className="block text-sm font-medium text-[#E0E0E0] mb-2">
          {t('slide_editors.image.image_label')}
        </label>
        
        {imageUrl ? (
          <div className="relative">
            <img 
              src={imageUrl} 
              alt="Uploaded" 
              className="w-full h-48 object-contain rounded-lg border border-[#2A2A2A] bg-[#232323]"
              onError={(e) => {
                e.target.style.display = 'none';
                toast.error(t('slide_editors.image.image_load_error'));
              }}
            />
            <button
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 p-1.5 bg-[#EF5350] rounded-full hover:bg-[#E53935] transition-colors"
              title={t('slide_editors.image.remove_image_title')}
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Upload Method Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setUploadMethod('file')}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  uploadMethod === 'file'
                    ? 'bg-[#4CAF50] text-white'
                    : 'bg-[#2A2A2A] text-[#9E9E9E] hover:bg-[#333333]'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Upload className="h-4 w-4" />
                  <span className="text-sm font-medium">{t('slide_editors.image.upload_file')}</span>
                </div>
              </button>
              <button
                onClick={() => setUploadMethod('url')}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  uploadMethod === 'url'
                    ? 'bg-[#4CAF50] text-white'
                    : 'bg-[#2A2A2A] text-[#9E9E9E] hover:bg-[#333333]'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">{t('slide_editors.image.add_url')}</span>
                </div>
              </button>
            </div>

            {/* File Upload Method */}
            {uploadMethod === 'file' && (
              <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center bg-[#232323] transition-all ${
                  isDragging 
                    ? 'border-[#4CAF50] bg-[#2A3A2A] scale-[1.02]' 
                    : 'border-[#2A2A2A] hover:border-[#4CAF50]/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <ImageIcon className={`h-10 w-10 mx-auto mb-3 transition-colors ${
                  isDragging ? 'text-[#4CAF50]' : 'text-[#9E9E9E]'
                }`} />
                <p className={`text-sm mb-3 transition-colors ${
                  isDragging ? 'text-[#4CAF50] font-medium' : 'text-[#9E9E9E]'
                }`}>
                  {isDragging 
                    ? t('slide_editors.image.drop_image_here') || 'Drop image here'
                    : t('slide_editors.image.upload_prompt')}
                </p>
                <label className="inline-flex items-center px-4 py-2 bg-[#4CAF50] text-white rounded-lg hover:bg-[#43A047] transition-colors cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? t('slide_editors.image.uploading') : t('slide_editors.image.choose_file')}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
                <p className="text-xs text-[#7E7E7E] mt-2">
                  {t('slide_editors.image.max_size')} • {t('slide_editors.image.drag_drop_hint') || 'Drag & drop or paste image'}
                </p>
              </div>
            )}

            {/* URL Input Method */}
            {uploadMethod === 'url' && (
              <div className="border-2 border-dashed border-[#2A2A2A] rounded-lg p-6 bg-[#232323]">
                <div className="flex items-center justify-center mb-3">
                  <LinkIcon className="h-10 w-10 text-[#9E9E9E]" />
                </div>
                <p className="text-sm text-[#9E9E9E] mb-3 text-center">{t('slide_editors.image.url_prompt')}</p>
                <div className="space-y-3">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder={t('slide_editors.image.url_placeholder')}
                    className="w-full px-3 py-2 border border-[#2A2A2A] rounded-lg text-sm bg-[#1F1F1F] text-[#E0E0E0] placeholder-[#8A8A8A] focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent outline-none"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleUrlSubmit();
                      }
                    }}
                    disabled={isValidatingUrl}
                  />
                  <button
                    onClick={handleUrlSubmit}
                    disabled={isValidatingUrl || !urlInput.trim()}
                    className="w-full px-4 py-2 bg-[#4CAF50] text-white rounded-lg hover:bg-[#43A047] transition-colors disabled:bg-[#2A2A2A] disabled:text-[#7E7E7E] disabled:cursor-not-allowed"
                  >
                    {isValidatingUrl ? t('slide_editors.image.validating') : t('slide_editors.image.add_image')}
                  </button>
                </div>
                <p className="text-xs text-[#7E7E7E] mt-2 text-center">{t('slide_editors.image.url_hint')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageEditor;