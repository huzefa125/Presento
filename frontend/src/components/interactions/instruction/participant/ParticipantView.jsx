import React, { useState, useEffect } from 'react';
import { BookOpen, Globe, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';

const InstructionParticipantView = ({ slide, presentation, isPreview = false }) => {
  const { t } = useTranslation();
  const [qrSize, setQrSize] = useState(140);

  useEffect(() => {
    const updateQrSize = () => {
      setQrSize(window.innerWidth < 640 ? 110 : 140);
    };
    updateQrSize();
    window.addEventListener('resize', updateQrSize);
    return () => window.removeEventListener('resize', updateQrSize);
  }, []);

  // Get the presentation access code
  const accessCode = presentation?.accessCode || '000000';

  const displayDomain = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'www.inavora.com'
    : (window.location.host || 'www.inavora.com');

  // Construct the URL for joining the presentation
  const joinUrl = `${window.location.origin}/join/${btoa(accessCode)}`;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center p-2 sm:p-4 my-auto font-sans">
      {/* Title */}
      <div className="flex items-center justify-center gap-2.5 mb-6 sm:mb-8">
        <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-2xs">
          <BookOpen className="h-6 w-6 sm:h-7 sm:w-7" />
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-ink tracking-tight">
          {t('slide_editors.instruction.participant_title') || 'Instructions'}
        </h2>
      </div>

      {/* Main 2 Cards Grid */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {/* Left Column - Website and Access Code */}
        <div className="flex flex-col items-center justify-between p-6 sm:p-8 bg-surface rounded-2xl border border-hairline shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-ink mb-2">
              {t('slide_editors.instruction.join_via_website_title') || 'Join via Website'}
            </h3>
            <p className="text-sm sm:text-base text-ink-secondary leading-relaxed mb-6">
              {t('slide_editors.instruction.join_via_website_description', { website: displayDomain })}
            </p>
          </div>

          <div className="w-full">
            <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl py-3.5 px-4 text-center">
              <p className="text-3xl sm:text-4xl font-black text-indigo-600 tracking-widest font-mono">
                {accessCode}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column - QR Code */}
        <div className="flex flex-col items-center justify-between p-6 sm:p-8 bg-surface rounded-2xl border border-hairline shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-ink mb-2">
              {t('slide_editors.instruction.scan_qr_code_title') || 'Scan QR Code'}
            </h3>
            <p className="text-sm sm:text-base text-ink-secondary leading-relaxed mb-4">
              {t('slide_editors.instruction.scan_qr_code_description') || 'Scan QR code to join directly'}
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-xs">
              <QRCodeSVG value={joinUrl} size={qrSize} level={'H'} includeMargin={false} />
            </div>
            <p className="text-xs text-ink-muted text-center font-medium mt-3">
              {isPreview ? t('slide_editors.instruction.qr_preview_message') : t('slide_editors.instruction.qr_live_message')}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-ink-muted font-medium">
        <p>
          {isPreview 
            ? t('slide_editors.instruction.preview_scan_redirect')
            : t('slide_editors.instruction.live_scan_redirect')}
        </p>
      </div>
    </div>
  );
};

export default InstructionParticipantView;