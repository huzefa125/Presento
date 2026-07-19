import React, { useState, useEffect, useRef } from 'react';
import { Upload, X, Link as LinkIcon } from 'lucide-react';
import SlideTypeHeader from '../common/SlideTypeHeader';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { uploadPowerPoint as uploadPowerPointService } from '../../../services/presentationService';

// File signatures for genuine Microsoft PowerPoint files
const OLE2_SIGNATURE = [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]; // .ppt (97-2003)
const ZIP_SIGNATURE = [0x50, 0x4B, 0x03, 0x04]; // .pptx (Office Open XML)

const readFileHeader = (file, length) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = (e) => resolve(new Uint8Array(e.target.result));
  reader.onerror = () => reject(new Error('Failed to read file header'));
  reader.readAsArrayBuffer(file.slice(0, length));
});

const matchesSignature = (bytes, signature) => signature.every((byte, i) => bytes[i] === byte);

const isMsPowerPointFile = async (file) => {
  try {
    const header = await readFileHeader(file, 8);
    return matchesSignature(header, OLE2_SIGNATURE) || matchesSignature(header, ZIP_SIGNATURE);
  } catch {
    return false;
  }
};

const PowerPointIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const PowerPointEditor = ({ slide, onUpdate }) => {
  const { t } = useTranslation();
  const [question, setQuestion] = useState(slide?.question || '');
  const [powerpointUrl, setPowerpointUrl] = useState(slide?.powerpointUrl || '');
  const [powerpointPublicId, setPowerpointPublicId] = useState(slide?.powerpointPublicId || '');
  const [uploadMethod, setUploadMethod] = useState('upload');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const isMounted = useRef(false);

  useEffect(() => {
    if (slide) {
      setQuestion(slide.question || '');
      setPowerpointUrl(slide.powerpointUrl || '');
      setPowerpointPublicId(slide.powerpointPublicId || '');
      setUploadMethod(slide.powerpointUrl && !slide.powerpointPublicId ? 'url' : 'upload');
    }
  }, [slide]);

  useEffect(() => {
    // Skip the first render to avoid infinite loop
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }

    // Update parent component when state changes
    // Don't trim question during typing to preserve spaces between words
    // Only trim URLs to remove accidental whitespace
    onUpdate({
      question: question,
      powerpointUrl: powerpointUrl.trim(),
      powerpointPublicId: powerpointPublicId
    });
  }, [question, powerpointUrl, powerpointPublicId, onUpdate]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const resetInput = () => {
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const validExtensions = ['.ppt', '.pptx'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!validExtensions.includes(fileExtension)) {
      toast.error(t('slide_editors.powerpoint.invalid_file_type'));
      resetInput();
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('slide_editors.powerpoint.file_too_large'));
      resetInput();
      return;
    }

    const isGenuine = await isMsPowerPointFile(file);
    if (!isGenuine) {
      toast.error(t('slide_editors.powerpoint.not_ms_powerpoint'));
      resetInput();
      return;
    }

    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const base64PowerPoint = event.target.result;

        const uploadPromise = uploadPowerPointService(base64PowerPoint).then((res) => {
          if (!res?.success) {
            throw new Error(res?.error || 'Upload failed');
          }
          return res;
        });

        toast.promise(uploadPromise, {
          loading: t('slide_editors.powerpoint.uploading'),
          success: t('slide_editors.powerpoint.upload_success'),
          error: (err) => err?.response?.data?.error || err?.message || t('slide_editors.powerpoint.upload_error')
        });

        const result = await uploadPromise;

        setPowerpointUrl(result.data.powerpointUrl);
        setPowerpointPublicId(result.data.publicId);

        onUpdate({
          question: question,
          powerpointUrl: result.data.powerpointUrl,
          powerpointPublicId: result.data.publicId
        });
      } catch (error) {
        console.error('Upload error:', error);
      } finally {
        setIsUploading(false);
        resetInput();
      }
    };
    reader.onerror = () => {
      toast.error(t('slide_editors.powerpoint.failed_read_file'));
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePowerPoint = () => {
    setPowerpointUrl('');
    setPowerpointPublicId('');
    setUploadMethod('upload');
    if (fileInputRef.current) fileInputRef.current.value = '';
    onUpdate({
      question: question,
      powerpointUrl: '',
      powerpointPublicId: ''
    });
  };

  const hasUploadedFile = powerpointUrl && powerpointPublicId;
  const tabButtonClass = (active) => `flex-1 px-4 py-2 rounded-md transition-colors border ${
    active
      ? 'bg-primary text-on-primary border-primary'
      : 'bg-surface text-ink-muted border-hairline hover:bg-canvas-soft'
  }`;

  return (
    <div className="h-full overflow-y-auto scrollbar-thin bg-canvas text-ink">
      <SlideTypeHeader type="powerpoint" />

      <div className="p-4 border-b border-hairline">
        <label className="block text-sm font-medium text-ink-secondary mb-2">
          {t('slide_editors.powerpoint.question_label')}
        </label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            // Explicitly allow space key - prevent any parent handlers from interfering
            if (e.key === ' ') {
              e.stopPropagation();
            }
          }}
          placeholder={t('slide_editors.powerpoint.question_placeholder')}
          className="w-full px-3 py-2 bg-surface border border-hairline rounded-md text-ink placeholder:text-ink-faint focus:outline-none focus:shadow-[var(--shadow-level-1)] focus:border-primary transition-shadow resize-none"
          rows="3"
        />
      </div>

      <div className="p-4 border-b border-hairline">
        <label className="block text-sm font-medium text-ink-secondary mb-3">
          {t('slide_editors.powerpoint.url_label')}
        </label>

        {hasUploadedFile ? (
          // Show uploaded file with option to remove
          <div className="relative rounded-lg overflow-hidden border border-hairline bg-canvas-soft p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <PowerPointIcon className="h-5 w-5 text-on-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">
                    {t('slide_editors.powerpoint.file_uploaded')}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {t('slide_editors.powerpoint.uploaded_successfully')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemovePowerPoint}
                className="p-1.5 bg-red-500 hover:bg-red-600 text-on-primary rounded-full transition-colors"
                title={t('slide_editors.powerpoint.remove_file_title')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Upload / URL method toggle */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setUploadMethod('upload')}
                className={tabButtonClass(uploadMethod === 'upload')}
              >
                <div className="flex items-center justify-center gap-2">
                  <Upload className="h-4 w-4" />
                  <span className="text-sm font-medium">{t('slide_editors.powerpoint.upload_method')}</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setUploadMethod('url')}
                className={tabButtonClass(uploadMethod === 'url')}
              >
                <div className="flex items-center justify-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">{t('slide_editors.powerpoint.url_method')}</span>
                </div>
              </button>
            </div>

            {uploadMethod === 'upload' ? (
              <div className="border-2 border-dashed border-hairline rounded-lg p-8 text-center hover:border-primary transition-colors bg-canvas-soft">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".ppt,.pptx"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-active disabled:opacity-50 text-on-primary rounded-full transition-colors text-sm font-medium"
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                      {t('slide_editors.powerpoint.uploading')}
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      {t('slide_editors.powerpoint.upload_file_button')}
                    </>
                  )}
                </button>
                <p className="text-xs text-ink-muted mt-2">
                  {t('slide_editors.powerpoint.file_requirements')}
                </p>
              </div>
            ) : (
              <>
                <input
                  type="url"
                  value={powerpointUrl}
                  onChange={(e) => setPowerpointUrl(e.target.value)}
                  placeholder={t('slide_editors.powerpoint.url_placeholder')}
                  className="w-full px-3 py-2 bg-surface border border-hairline rounded-md text-ink placeholder:text-ink-faint focus:outline-none focus:shadow-[var(--shadow-level-1)] focus:border-primary transition-shadow"
                />
                <p className="mt-1 text-xs text-ink-faint">
                  {t('slide_editors.powerpoint.url_description')}
                </p>
              </>
            )}
          </>
        )}
      </div>

      {powerpointUrl && (
        <div className="p-4 border-b border-hairline">
          <h4 className="text-sm font-medium text-ink-secondary mb-2">{t('slide_editors.powerpoint.preview_title')}</h4>
          <div className="aspect-video bg-canvas-soft rounded overflow-hidden flex items-center justify-center">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mb-3">
                <PowerPointIcon className="h-6 w-6 text-on-primary" />
              </div>
              <p className="text-ink-secondary mb-2">{t('slide_editors.powerpoint.presentation_label')}</p>
              <a
                href={powerpointUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-primary hover:bg-primary-active text-on-primary font-medium rounded-full transition duration-200"
              >
                {t('slide_editors.powerpoint.view_presentation')}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PowerPointEditor;
