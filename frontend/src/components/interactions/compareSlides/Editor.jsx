import { useState, useEffect, useRef } from 'react';
import { Upload, X, Type as TextTypeIcon, Image as ImageIcon } from 'lucide-react';
import SlideTypeHeader from '../common/SlideTypeHeader';
import toast from 'react-hot-toast';
import * as presentationService from '../../../services/presentationService';
import { useTranslation } from 'react-i18next';

const emptyOption = (label) => ({ contentType: 'text', text: '', imageUrl: '', imagePublicId: '', label });

const OptionPanel = ({ side, label, option, onChange, isUploading, onImageSelect, onRemoveImage }) => {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);

  return (
    <div className="border border-hairline rounded-lg p-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-ink">{label}</span>
        <div className="flex rounded-full bg-canvas-soft p-0.5">
          <button
            type="button"
            onClick={() => onChange({ contentType: 'text' })}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
              option.contentType === 'text' ? 'bg-primary text-on-primary' : 'text-ink-muted'
            }`}
          >
            <TextTypeIcon className="w-3.5 h-3.5" />
            {t('slide_editors.compare_slides.text_tab')}
          </button>
          <button
            type="button"
            onClick={() => onChange({ contentType: 'image' })}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
              option.contentType === 'image' ? 'bg-primary text-on-primary' : 'text-ink-muted'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            {t('slide_editors.compare_slides.image_tab')}
          </button>
        </div>
      </div>

      {option.contentType === 'text' ? (
        <textarea
          value={option.text}
          onChange={(e) => onChange({ text: e.target.value })}
          className="w-full px-3 py-2 border border-hairline rounded-md text-sm bg-surface text-ink placeholder-ink-faint focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none resize-none"
          placeholder={t('slide_editors.compare_slides.text_placeholder')}
          rows={3}
        />
      ) : option.imageUrl ? (
        <div className="relative rounded-lg overflow-hidden border border-hairline bg-surface">
          <img src={option.imageUrl} alt={label} className="w-full h-auto object-contain bg-canvas-soft" style={{ maxHeight: '160px' }} />
          <button
            type="button"
            onClick={onRemoveImage}
            className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
            title={t('slide_editors.compare_slides.remove_image_title')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-hairline rounded-lg p-4 text-center hover:border-primary transition-colors bg-canvas-soft">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onImageSelect}
            className="hidden"
            disabled={isUploading}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary hover:bg-primary-active disabled:opacity-50 disabled:pointer-events-none text-on-primary rounded-full transition-colors text-xs font-medium"
          >
            {isUploading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                {t('slide_editors.compare_slides.uploading')}
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                {t('slide_editors.compare_slides.upload_image_button')}
              </>
            )}
          </button>
          <p className="text-xs text-ink-muted mt-2">{t('slide_editors.pin_on_image.file_requirements')}</p>
        </div>
      )}
    </div>
  );
};

const CompareSlidesEditor = ({ slide, onUpdate }) => {
  const { t } = useTranslation();
  const [question, setQuestion] = useState(slide?.question || '');
  const [optionA, setOptionA] = useState(slide?.compareSettings?.optionA || emptyOption('Option A'));
  const [optionB, setOptionB] = useState(slide?.compareSettings?.optionB || emptyOption('Option B'));
  const [uploadingSide, setUploadingSide] = useState(null);

  useEffect(() => {
    setQuestion(slide?.question || '');
    setOptionA(slide?.compareSettings?.optionA || emptyOption('Option A'));
    setOptionB(slide?.compareSettings?.optionB || emptyOption('Option B'));
  }, [slide]);

  const emitUpdate = (nextQuestion, nextOptionA, nextOptionB) => {
    onUpdate({
      ...slide,
      question: nextQuestion,
      compareSettings: { optionA: nextOptionA, optionB: nextOptionB }
    });
  };

  const handleQuestionChange = (value) => {
    setQuestion(value);
    emitUpdate(value, optionA, optionB);
  };

  const handleOptionChange = (side, patch) => {
    if (side === 'A') {
      const next = { ...optionA, ...patch };
      setOptionA(next);
      emitUpdate(question, next, optionB);
    } else {
      const next = { ...optionB, ...patch };
      setOptionB(next);
      emitUpdate(question, optionA, next);
    }
  };

  const handleImageSelect = async (side, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(t('slide_editors.pin_on_image.select_image_file'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('slide_editors.pin_on_image.image_size_limit'));
      return;
    }

    setUploadingSide(side);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const base64Image = event.target.result;
        const uploadPromise = presentationService.uploadImage(base64Image).then((res) => {
          if (!res?.success) throw new Error(res?.error || 'Upload failed');
          return res;
        });

        toast.promise(uploadPromise, {
          loading: t('slide_editors.compare_slides.uploading'),
          success: (result) => result?.message || 'Image uploaded successfully',
          error: (err) => err?.response?.data?.error || err?.message || 'Failed to upload image'
        });

        const result = await uploadPromise;
        handleOptionChange(side, { imageUrl: result.data.imageUrl, imagePublicId: result.data.publicId });
      } catch (error) {
        console.error('Upload error:', error);
      } finally {
        setUploadingSide(null);
      }
    };
    reader.onerror = () => {
      toast.error(t('slide_editors.pin_on_image.failed_read_image'));
      setUploadingSide(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (side) => {
    handleOptionChange(side, { imageUrl: '', imagePublicId: '' });
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin bg-canvas-soft text-ink">
      <SlideTypeHeader type="compare_slides" />

      <div className="p-4 border-b border-hairline">
        <label className="block text-sm font-medium text-ink mb-2">
          {t('slide_editors.compare_slides.question_label')}
        </label>
        <textarea
          value={question}
          onChange={(e) => handleQuestionChange(e.target.value)}
          className="w-full px-3 py-2 border border-hairline rounded-md text-sm bg-surface text-ink placeholder-ink-faint focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none resize-none"
          placeholder={t('slide_editors.compare_slides.question_placeholder')}
          rows={3}
        />
      </div>

      <div className="p-4 space-y-4">
        <OptionPanel
          side="A"
          label={t('slide_editors.compare_slides.option_a')}
          option={optionA}
          onChange={(patch) => handleOptionChange('A', patch)}
          isUploading={uploadingSide === 'A'}
          onImageSelect={(e) => handleImageSelect('A', e)}
          onRemoveImage={() => handleRemoveImage('A')}
        />
        <OptionPanel
          side="B"
          label={t('slide_editors.compare_slides.option_b')}
          option={optionB}
          onChange={(patch) => handleOptionChange('B', patch)}
          isUploading={uploadingSide === 'B'}
          onImageSelect={(e) => handleImageSelect('B', e)}
          onRemoveImage={() => handleRemoveImage('B')}
        />
      </div>
    </div>
  );
};

export default CompareSlidesEditor;
