import { useState } from 'react';
import { X, Copy, Check, Link as LinkIcon, Hash } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ShareModal = ({ isOpen, onClose, accessCode }) => {
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const { t } = useTranslation();

  if (!isOpen) return null;

  // Generate join link
  const joinLink = `${window.location.origin}/join/${btoa(accessCode)}`;

  // Copy access code to clipboard
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(accessCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  // Copy join link to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md mx-4 rounded-2xl bg-[#0F0F0F] shadow-2xl border border-[#2A2A2A] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A2A]">
          <h2 className="text-xl font-semibold text-[#FFFFFF]">{t('presentation.share_modal_title')}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[#2A2A2A] transition-colors"
          >
            <X className="h-5 w-5 text-[#8A8A8A] hover:text-[#E0E0E0]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Access Code Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Hash className="h-5 w-5 text-[#4CAF50]" />
              <label className="text-sm font-medium text-[#E0E0E0]">
                {t('presentation.access_code')}
              </label>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch gap-3">
              <div className="flex-1 px-4 py-4 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center">
                <p className="text-2xl sm:text-3xl font-bold text-[#4CAF50] tracking-[0.2em] sm:tracking-[0.3em] text-center font-mono">
                  {accessCode}
                </p>
              </div>
              <button
                onClick={handleCopyCode}
                className="px-4 py-4 rounded-lg bg-[#4CAF50] hover:bg-[#45A049] text-white transition-colors flex items-center justify-center gap-2 font-medium shadow-lg"
              >
                {codeCopied ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span className="text-sm hidden xs:inline">{t('presentation.copied')}</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span className="text-sm hidden xs:inline">{t('presentation.copy')}</span>
                  </>
                )}
              </button>
            </div>
            <p className="mt-2 text-xs text-[#8A8A8A]">
              {t('presentation.access_code_description')}
            </p>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#2A2A2A]"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-[#0F0F0F] text-[#6C6C6C]">{t('presentation.or')}</span>
            </div>
          </div>

          {/* Join Link Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <LinkIcon className="h-5 w-5 text-[#4CAF50]" />
              <label className="text-sm font-medium text-[#E0E0E0]">
                {t('presentation.join_link')}
              </label>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch gap-3">
              <div className="flex-1 px-4 py-3 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] flex items-center">
                <p className="text-sm text-[#B0B0B0] truncate w-full text-center sm:text-left">
                  {joinLink}
                </p>
              </div>
              <button
                onClick={handleCopyLink}
                className="px-4 py-3 rounded-lg bg-[#4CAF50] hover:bg-[#45A049] text-white transition-colors flex items-center justify-center gap-2 font-medium shadow-lg"
              >
                {linkCopied ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span className="text-sm hidden xs:inline">{t('presentation.copied')}</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span className="text-sm hidden xs:inline">{t('presentation.copy')}</span>
                  </>
                )}
              </button>
            </div>
            <p className="mt-2 text-xs text-[#8A8A8A]">
              {t('presentation.join_link_description')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;