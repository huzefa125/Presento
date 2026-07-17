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
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={isLoading ? undefined : onCancel}
      />
      <div className="relative z-10 w-full max-w-md mx-4 rounded-xl bg-surface border border-hairline shadow-[var(--shadow-level-2)]">
        <div className="flex items-center justify-between px-6 pt-6">
          <h2 className="text-xl font-semibold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-full text-ink-muted hover:bg-canvas-soft transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {description && (
          <p className="px-6 mt-3 text-sm text-ink-secondary">{description}</p>
        )}
        <div className="flex justify-end gap-3 px-6 py-6">
          {!secondaryAction &&
            <button
            type="button"
            onClick={isLoading ? undefined : onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-md bg-surface border border-hairline text-ink hover:bg-canvas-soft transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelLabel}
          </button>}
          {secondaryAction && (
            <button
              type="button"
              onClick={isLoading ? undefined : secondaryAction.onClick}
              disabled={isLoading}
              className="px-4 py-2 rounded-md border border-red-300 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {secondaryAction.label}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 rounded-full bg-primary text-on-primary hover:bg-primary-active transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
