import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';

const InstructionParticipantView = ({ slide, presentation, isPreview = false }) => {
  const { t } = useTranslation();
  const [qrSize, setQrSize] = useState(128);
  
  useEffect(() => {
    const updateQrSize = () => {
      setQrSize(window.innerWidth < 640 ? 100 : 128);
    };
    updateQrSize();
    window.addEventListener('resize', updateQrSize);
    return () => window.removeEventListener('resize', updateQrSize);
  }, []);
  
  // Get the presentation access code
  const accessCode = presentation?.accessCode || '000000';
  
  // Construct the URL for joining the presentation
  const joinUrl = `${window.location.origin}/join/${btoa(accessCode)}`;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow flex flex-col items-center justify-center p-3 sm:p-4 md:p-6">
        <div className="w-full max-w-4xl">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-ink mb-4 sm:mb-6 text-center px-2">
            {t('slide_editors.instruction.participant_title')}
          </h2>

          <div className="bg-surface rounded-xl overflow-hidden border border-hairline shadow-[var(--shadow-level-1)] p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
              {/* Left Column - Website and Access Code */}
              <div className="flex flex-col items-center justify-center p-4 sm:p-6 bg-canvas-soft rounded-lg">
                <h3 className="text-lg sm:text-xl font-semibold text-ink mb-3 sm:mb-4 text-center">
                  {t('slide_editors.instruction.join_via_website_title')}
                </h3>
                <p className="text-sm sm:text-base text-ink-secondary mb-3 sm:mb-4 text-center px-2">
                  {t('slide_editors.instruction.join_via_website_description', { website: 'www.inavora.com' })}
                </p>
                <div className="bg-surface border border-hairline rounded-lg p-3 sm:p-4 mb-3 sm:mb-4 w-full">
                  <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary tracking-wider text-center break-all">
                    {accessCode}
                  </p>
                </div>
              </div>

              {/* Right Column - QR Code */}
              <div className="flex flex-col items-center justify-center p-4 sm:p-6 bg-canvas-soft rounded-lg">
                <h3 className="text-lg sm:text-xl font-semibold text-ink mb-3 sm:mb-4 text-center">
                  {t('slide_editors.instruction.scan_qr_code_title')}
                </h3>
                <p className="text-sm sm:text-base text-ink-secondary mb-3 sm:mb-4 text-center px-2">
                  {t('slide_editors.instruction.scan_qr_code_description')}
                </p>
                <div className="bg-surface border border-hairline p-2 sm:p-4 rounded-lg flex-shrink-0">
                  <QRCodeSVG
                    value={joinUrl}
                    size={qrSize}
                    level={'H'}
                    includeMargin={true}
                  />
                </div>
                <p className="text-xs sm:text-sm text-ink-muted mt-2 sm:mt-3 text-center px-2">
                  {isPreview ? t('slide_editors.instruction.qr_preview_message') : t('slide_editors.instruction.qr_live_message')}
                </p>
              </div>
            </div>

            <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-ink-muted px-2">
              <p>
                {isPreview 
                  ? t('slide_editors.instruction.preview_scan_redirect')
                  : t('slide_editors.instruction.live_scan_redirect')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructionParticipantView;