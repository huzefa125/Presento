import { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Target, Images } from 'lucide-react';
import SlideTypeHeader from '../common/SlideTypeHeader';
import toast from 'react-hot-toast';
import * as presentationService from '../../../services/presentationService';
import AreaSelector from './AreaSelector';
import ImageGallery from './ImageGallery';
import { useTranslation } from 'react-i18next';

const PinOnImageEditor = ({ slide, onUpdate }) => {
  const { t } = useTranslation();
  const [question, setQuestion] = useState(slide?.question || '');
  const [imageUrl, setImageUrl] = useState(slide?.pinOnImageSettings?.imageUrl || '');
  const [imagePublicId, setImagePublicId] = useState(slide?.pinOnImageSettings?.imagePublicId || '');
  const [correctArea, setCorrectArea] = useState(slide?.pinOnImageSettings?.correctArea || null);
  const [isUploading, setIsUploading] = useState(false);
  const [showAreaSelector, setShowAreaSelector] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const fileInputRef = useRef(null);
  const isHydrating = useRef(true);
  const questionDebounceRef = useRef(null);

  const emitUpdate = useCallback((next = {}) => {
    if (isHydrating.current) return;

    const nextQuestion = next.question !== undefined ? next.question : question;
    const nextImageUrl = next.imageUrl !== undefined ? next.imageUrl : imageUrl;
    const nextImagePublicId = next.imagePublicId !== undefined ? next.imagePublicId : imagePublicId;
    const nextCorrectArea = next.correctArea !== undefined ? next.correctArea : correctArea;

    onUpdate?.({
      question: nextQuestion,
      pinOnImageSettings: nextImageUrl
        ? {
            imageUrl: nextImageUrl,
            imagePublicId: nextImagePublicId,
            correctArea: nextCorrectArea,
          }
        : null,
    });
  }, [question, imageUrl, imagePublicId, correctArea, onUpdate]);

  useEffect(() => {
    isHydrating.current = true;
    setQuestion(slide?.question || '');
    setImageUrl(slide?.pinOnImageSettings?.imageUrl || '');
    setImagePublicId(slide?.pinOnImageSettings?.imagePublicId || '');
    setCorrectArea(slide?.pinOnImageSettings?.correctArea || null);

    const timeout = setTimeout(() => {
      isHydrating.current = false;
    }, 0);

    return () => clearTimeout(timeout);
  }, [slide]);

  const handleQuestionChange = (value) => {
    setQuestion(value);

    if (questionDebounceRef.current) {
      clearTimeout(questionDebounceRef.current);
    }

    questionDebounceRef.current = setTimeout(() => {
      emitUpdate({ question: value });
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (questionDebounceRef.current) {
        clearTimeout(questionDebounceRef.current);
      }
    };
  }, []);

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('slide_editors.pin_on_image.select_image_file'));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('slide_editors.pin_on_image.image_size_limit'));
      return;
    }

    try {
      setIsUploading(true);

      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64Image = event.target.result;
          
          const uploadPromise = presentationService
            .uploadImage(base64Image)
            .then((res) => {
              if (!res?.success) {
                throw new Error(res?.error || 'Upload failed');
              }
              return res;
            });

          toast.promise(uploadPromise, {
            loading: 'Uploading image...',
            success: (result) => result?.message || 'Image uploaded successfully',
            error: (err) => err?.response?.data?.error || err?.message || 'Failed to upload image'
          });

          const result = await uploadPromise;

          setImageUrl(result.data.imageUrl);
          setImagePublicId(result.data.publicId);
          emitUpdate({
            imageUrl: result.data.imageUrl,
            imagePublicId: result.data.publicId,
          });
        } catch (error) {
          console.error('Upload error:', error);
        } finally {
          setIsUploading(false);
        }
      };
      reader.onerror = () => {
        toast.error(t('slide_editors.pin_on_image.failed_read_image'));
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Image select error:', error);
      toast.error(t('slide_editors.pin_on_image.failed_process_image'));
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    setImagePublicId('');
    setCorrectArea(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    emitUpdate({ imageUrl: '', imagePublicId: '', correctArea: null });
  };

  return (
    <>
      <div className="h-full overflow-y-auto scrollbar-thin bg-[#1F1F1F] text-[#E0E0E0]">
        <SlideTypeHeader type="pin_on_image" />

        {/* Question */}
        <div className="p-4 border-b border-[#2A2A2A]">
          <label className="block text-sm font-medium text-[#E0E0E0] mb-2">
            {t('slide_editors.pin_on_image.question_label')}
          </label>
          <textarea
            value={question}
            onChange={(e) => handleQuestionChange(e.target.value)}
            className="w-full px-3 py-2 border border-[#2A2A2A] rounded-lg text-sm bg-[#232323] text-[#E0E0E0] placeholder-[#8A8A8A] focus:ring-2 focus:ring-[#4CAF50] focus-border-transparent outline-none resize-none"
            placeholder={t('slide_editors.pin_on_image.question_placeholder')}
            rows={3}
          />
          <p className="mt-2 text-xs text-[#9E9E9E]">
            {t('slide_editors.pin_on_image.question_instructions')}
          </p>
        </div>

        {/* Image Upload */}
        <div className="p-4 border-b border-[#2A2A2A]">
          <label className="block text-sm font-medium text-[#E0E0E0] mb-3">{t('slide_editors.pin_on_image.background_image_label')}</label>

          {!imageUrl ? (
            <div className="space-y-3">
              <div className="border-2 border-dashed border-[#2A2A2A] rounded-lg p-8 text-center hover:border-[#4CAF50]/60 transition-colors bg-[#232323]">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  disabled={isUploading}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#388E3C] hover:bg-[#2E7D32] disabled:bg-[#555555] text-white rounded-lg transition-colors text-sm font-medium"
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t('slide_editors.pin_on_image.uploading')}
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      {t('slide_editors.pin_on_image.upload_image_button')}
                    </>
                  )}
                </button>
                <p className="text-xs text-[#9E9E9E] mt-2">{t('slide_editors.pin_on_image.file_requirements')}</p>
              </div>

              <button
                type="button"
                onClick={() => setShowImageGallery(true)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#2A2A2A] hover:bg-[#333333] text-[#E0E0E0] rounded-lg transition-colors text-sm font-medium"
              >
                <Images className="w-4 h-4" />
                {t('slide_editors.pin_on_image.choose_from_library')}
              </button>
            </div>
          ) : (
            <div className="relative rounded-lg overflow-hidden border border-[#2A2A2A] bg-[#232323]">
              <img
                src={imageUrl}
                alt="Background"
                className="w-full h-auto object-contain bg-[#1F1F1F]"
                style={{ maxHeight: '60vh' }}
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 p-1.5 bg-[#EF5350] hover:bg-[#E53935] text-white rounded-full transition-colors"
                title={t('slide_editors.pin_on_image.remove_image_title')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Correct Area Selection */}
        {imageUrl && (
          <div className="p-4 border-b border-[#2A2A2A]">
            <label className="block text-sm font-medium text-[#E0E0E0] mb-2">{t('slide_editors.pin_on_image.correct_area_label')}</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowAreaSelector(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#388E3C] hover:bg-[#2E7D32] text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Target className="w-4 h-4" />
                {correctArea ? t('slide_editors.pin_on_image.edit_area_button') : t('slide_editors.pin_on_image.select_correct_area_button')}
              </button>
              {correctArea && (
                <span className="text-xs text-[#76C68F]">✓ {t('slide_editors.pin_on_image.correct_area_defined')}</span>
              )}
            </div>
            <p className="mt-2 text-xs text-[#9E9E9E]">
              {t('slide_editors.pin_on_image.correct_area_instructions')}
            </p>
          </div>
        )}

        {/* Info */}
        <div className="p-4 text-xs text-[#9E9E9E] bg-[#232323]">
          <div className="flex items-start gap-2">
            <ImageIcon className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#4CAF50]" />
            <div>
              {t('slide_editors.pin_on_image.info_text')}
            </div>
          </div>
        </div>
      </div>

      {/* Area Selector Modal */}
      {showAreaSelector && imageUrl && (
        <AreaSelector
          imageUrl={imageUrl}
          initialArea={correctArea}
          onSave={(area) => {
            setCorrectArea(area);
            setShowAreaSelector(false);
            toast.success(t('slide_editors.pin_on_image.correct_area_saved'));
            emitUpdate({ correctArea: area });
          }}
          onCancel={() => setShowAreaSelector(false)}
        />
      )}

      {/* Image Gallery Modal */}
      {showImageGallery && (
        <ImageGallery
          onSelect={(image) => {
            setImageUrl(image.imageUrl);
            setImagePublicId(image.publicId);
            toast.success(t('slide_editors.pin_on_image.image_selected'));
            emitUpdate({
              imageUrl: image.imageUrl,
              imagePublicId: image.publicId,
            });
          }}
          onClose={() => setShowImageGallery(false)}
        />
      )}
    </>
  );
};

export default PinOnImageEditor;
