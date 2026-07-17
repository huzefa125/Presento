import { X, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ConfirmDialog = ({
  isOpen,
  title,
  description,
  confirmLabel = 'confirm_dialog.confirm',
  cancelLabel = 'confirm_dialog.cancel',
  onConfirm,
  onCancel,
  isLoading = false,
  secondaryAction,
}) => {
  const { t } = useTranslation();
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70"
        onClick={isLoading ? undefined : onCancel}
      />
      <div className="relative z-10 w-full max-w-md mx-4 rounded-2xl bg-[#1E1E1E] border border-[#2F2F2F] shadow-[0_20px_45px_rgba(0,0,0,0.65)]">
        <div className="flex items-center justify-between px-6 pt-6">
          <h2 className="text-xl font-semibold text-[#E0E0E0]">{title}</h2>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-full text-[#9E9E9E] hover:bg-[#2A2A2A] transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {description && (
          <p className="px-6 mt-3 text-sm text-[#B0B0B0]">{description}</p>
        )}
        <div className="flex justify-end gap-3 px-6 py-6">
          {!secondaryAction &&
            <button
            type="button"
            onClick={isLoading ? undefined : onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg border border-[#2F2F2F] text-[#B0B0B0] hover:bg-[#2A2A2A] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelLabel}
          </button>}
          {secondaryAction && (
            <button
              type="button"
              onClick={isLoading ? undefined : secondaryAction.onClick}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {secondaryAction.label}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-[#388E3C] text-white hover:bg-[#2E7D32] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-[0_10px_25px_rgba(56,142,60,0.35)]"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLoading ? t('confirm_dialog.processing') : (typeof confirmLabel === 'string' && confirmLabel.startsWith('confirm_dialog.')) ? t(confirmLabel) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
