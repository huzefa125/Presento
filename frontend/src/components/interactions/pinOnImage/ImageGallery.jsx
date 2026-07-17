import { useState, useEffect, useCallback } from 'react';
import { X, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import * as presentationService from '../../../services/presentationService';
import ConfirmDialog from '../../common/ConfirmDialog';

const ImageGallery = ({ onSelect, onClose }) => {
  const { t } = useTranslation();
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, target: null });

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      setIsLoading(true);
      const response = await presentationService.getUserImages();
      setImages(response.data || []);
    } catch (error) {
      console.error('Load images error:', error);
      toast.error(t('toasts.image_gallery.failed_to_load'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = useCallback(async () => {
    if (!deleteDialog.target) {
      console.log('No target in deleteDialog');
      return;
    }

    const { publicId } = deleteDialog.target;
    console.log('Attempting to delete image with publicId:', publicId);

    try {
      setDeletingId(publicId);
      const result = await presentationService.deleteImage(publicId);
      console.log('Delete result:', result);
      setImages(prev => prev.filter(img => img.publicId !== publicId));
      toast.success(t('toasts.image_gallery.deleted_success'));
    } catch (error) {
      console.error('Delete image error:', error);
      toast.error(t('toasts.image_gallery.delete_failed'));
    } finally {
      setDeletingId(null);
      setDeleteDialog({ open: false, target: null });
    }
  }, [deleteDialog.target]);

  const handleSelect = (image) => {
    onSelect(image);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
        {deletingId && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm text-white z-50">
            <div className="flex items-center gap-3 text-sm font-medium">
              <Loader2 className="h-5 w-5 animate-spin text-[#4CAF50]" />
              {t('slide_editors.pin_on_image.deleting_image')}...
            </div>
          </div>
        )}
        <div className="bg-[#232323] text-[#E0E0E0] rounded-xl shadow-2xl max-w-5xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#2A2A2A] flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#E0E0E0]">Your Images</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#2A2A2A] rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-[#4CAF50] animate-spin" />
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-[#9E9E9E]">
              <ImageIcon className="w-16 h-16 mb-4 opacity-50 text-[#4CAF50]" />
              <p className="text-sm">No images uploaded yet</p>
              <p className="text-xs mt-1">Upload an image to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {images.map((image) => (
                <div
                  key={image.publicId}
                  className="group relative h-32 sm:h-36 rounded-lg overflow-hidden border border-[#2A2A2A] hover:border-[#4CAF50] transition-colors cursor-pointer bg-[#232323]"
                  onClick={() => handleSelect(image)}
                >
                  <img
                    src={image.imageUrl}
                    alt="Uploaded"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteDialog({ open: true, target: image });
                    }}
                    disabled={deletingId === image.publicId}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-[#EF5350] hover:bg-[#E53935] text-white rounded-full disabled:bg-[#555555]"
                    title="Delete image"
                  >
                    {deletingId === image.publicId ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>

                  {/* Upload date */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                    <p className="text-[10px] text-white/90 truncate">
                      {new Date(image.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#2A2A2A] flex items-center justify-between">
          <p className="text-sm text-[#9E9E9E]">
            {images.length} image{images.length === 1 ? '' : 's'}
          </p>
          <button
            onClick={onClose}
            disabled={Boolean(deletingId)}
            className="px-4 py-2 text-sm text-[#E0E0E0] hover:bg-[#2A2A2A] rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Close
          </button>
        </div>
      </div>
    </div>

      <ConfirmDialog
        isOpen={deleteDialog.open}
        title={t('slide_editors.pin_on_image.delete_image_title')}
        description={t('slide_editors.pin_on_image.delete_image_description')}
        confirmLabel={t('slide_editors.pin_on_image.delete')}
        cancelLabel={t('slide_editors.pin_on_image.cancel')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ open: false, target: null })}
        isLoading={Boolean(deletingId)}
      />
    </>
  );
};

export default ImageGallery;