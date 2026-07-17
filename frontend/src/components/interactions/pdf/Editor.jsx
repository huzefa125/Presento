import React, { useState, useEffect, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import SlideTypeHeader from '../common/SlideTypeHeader';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { uploadPdf as uploadPdfService } from '../../../services/presentationService';

const PdfEditor = ({ slide, onUpdate }) => {
  const { t } = useTranslation();
  const [question, setQuestion] = useState(slide?.question || '');
  const [pdfUrl, setPdfUrl] = useState(slide?.pdfUrl || '');
  const [pdfPublicId, setPdfPublicId] = useState(slide?.pdfPublicId || '');
  const [pdfPages, setPdfPages] = useState(slide?.pdfPages || []);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const isMounted = useRef(false);
  const prevValuesRef = useRef({ question: '', pdfUrl: '', pdfPublicId: '', pdfPages: [] });

  useEffect(() => {
    if (slide) {
      setQuestion(slide.question || '');
      setPdfUrl(slide.pdfUrl || '');
      setPdfPublicId(slide.pdfPublicId || '');
      setPdfPages(slide.pdfPages || []);
    }
  }, [slide?.id, slide?.question, slide?.pdfUrl, slide?.pdfPublicId, slide?.pdfPages]);

  useEffect(() => {
    // Skip the first render to avoid infinite loop
    if (!isMounted.current) {
      isMounted.current = true;
      prevValuesRef.current = {
        question: question.trim(),
        pdfUrl: pdfUrl.trim(),
        pdfPublicId: pdfPublicId,
        pdfPages: pdfPages
      };
      return;
    }
    
    // Only update if values actually changed
    const currentValues = {
      question: question.trim(),
      pdfUrl: pdfUrl.trim(),
      pdfPublicId: pdfPublicId,
      pdfPages: pdfPages
    };
    
    const hasChanged = 
      prevValuesRef.current.question !== currentValues.question ||
      prevValuesRef.current.pdfUrl !== currentValues.pdfUrl ||
      prevValuesRef.current.pdfPublicId !== currentValues.pdfPublicId ||
      JSON.stringify(prevValuesRef.current.pdfPages) !== JSON.stringify(currentValues.pdfPages);
    
    if (hasChanged) {
      prevValuesRef.current = currentValues;
      onUpdate(currentValues);
    }
  }, [question, pdfUrl, pdfPublicId, pdfPages, onUpdate]);

  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf'];
    const validExtensions = ['.pdf'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      toast.error(t('slide_editors.pdf.invalid_file_type'));
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('slide_editors.pdf.file_too_large'));
      return;
    }

    try {
      setIsUploading(true);

      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64Pdf = event.target.result;
          
          const uploadPromise = uploadPdfService(base64Pdf)
            .then((res) => {
              if (!res?.success) {
                throw new Error(res?.error || 'Upload failed');
              }
              return res;
            });

          toast.promise(uploadPromise, {
            loading: t('slide_editors.pdf.uploading'),
            success: (result) => {
              const pageCount = result?.data?.pdfPages?.length || 0;
              return pageCount > 0 
                ? t('slide_editors.pdf.upload_success_with_pages', { count: pageCount })
                : t('slide_editors.pdf.upload_success');
            },
            error: (err) => err?.response?.data?.error || err?.message || t('slide_editors.pdf.upload_error')
          });

          const result = await uploadPromise;

          setPdfUrl(result.data.pdfUrl);
          setPdfPublicId(result.data.publicId);
          setPdfPages(result.data.pdfPages || []);
          
          const updateData = {
            question: question.trim(),
            pdfUrl: result.data.pdfUrl,
            pdfPublicId: result.data.publicId,
            pdfPages: result.data.pdfPages || []
          };
          
          onUpdate(updateData);
          
          // Show reminder to save the slide
          if (result.data.pdfPages && result.data.pdfPages.length > 0) {
            toast.success(
              t('slide_editors.pdf.upload_success_with_pages', { count: result.data.pdfPages.length }) + 
              '. ' + t('slide_editors.pdf.save_reminder'),
              { duration: 5000 }
            );
          }
        } catch (error) {
          console.error('Upload error:', error);
          toast.error(error?.response?.data?.error || error?.message || t('slide_editors.pdf.upload_error'));
        } finally {
          setIsUploading(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };
      reader.onerror = () => {
        toast.error(t('slide_editors.pdf.failed_read_file'));
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('PDF upload error:', error);
      toast.error(t('slide_editors.pdf.upload_error'));
      setIsUploading(false);
    }
  };

  const handleRemovePdf = () => {
    setPdfUrl('');
    setPdfPublicId('');
    setPdfPages([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onUpdate({
      question: question.trim(),
      pdfUrl: '',
      pdfPublicId: '',
      pdfPages: []
    });
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin bg-[#1F1F1F] text-[#E0E0E0]">
      <SlideTypeHeader type="pdf" />
      
      <div className="p-4 border-b border-[#2A2A2A]">
        <label className="block text-sm font-medium text-[#E0E0E0] mb-2">
          {t('slide_editors.pdf.title_label')}
        </label>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t('slide_editors.pdf.title_placeholder')}
          className="w-full px-3 py-2 bg-[#2A2A2A] border border-[#3B3B3B] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
      </div>

      <div className="p-4 border-b border-[#2A2A2A]">
        <label className="block text-sm font-medium text-[#E0E0E0] mb-3">
          {t('slide_editors.pdf.pdf_label')}
        </label>
        
        {!pdfUrl ? (
          <div className="border-2 border-dashed border-[#2A2A2A] rounded-lg p-8 text-center hover:border-[#4CAF50]/60 transition-colors bg-[#232323]">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handlePdfUpload}
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
                  {t('slide_editors.pdf.uploading')}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  {t('slide_editors.pdf.upload_file_button')}
                </>
              )}
            </button>
            <p className="text-xs text-[#9E9E9E] mt-2">
              {t('slide_editors.pdf.file_requirements')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative rounded-lg overflow-hidden border border-[#2A2A2A] bg-[#232323] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#E0E0E0]">
                      {t('slide_editors.pdf.file_uploaded')}
                    </p>
                    <p className="text-xs text-[#9E9E9E]">
                      {pdfPages.length > 0 
                        ? t('slide_editors.pdf.pages_converted', { count: pdfPages.length })
                        : t('slide_editors.pdf.uploaded_successfully')}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemovePdf}
                  className="p-1.5 bg-[#EF5350] hover:bg-[#E53935] text-white rounded-full transition-colors"
                  title={t('slide_editors.pdf.remove_file_title')}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {pdfPages.length > 0 && (
              <div className="border border-[#2A2A2A] rounded-lg p-4 bg-[#232323]">
                <p className="text-sm font-medium text-[#E0E0E0] mb-3">
                  {t('slide_editors.pdf.preview_pages')} ({pdfPages.length})
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                  {pdfPages.map((page, index) => (
                    <div key={index} className="relative aspect-[4/3] bg-[#1F1F1F] rounded border border-[#2A2A2A] overflow-hidden">
                      <img 
                        src={page.imageUrl} 
                        alt={`Page ${page.pageNumber}`}
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs text-center py-1">
                        {t('slide_editors.pdf.page')} {page.pageNumber}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfEditor;

