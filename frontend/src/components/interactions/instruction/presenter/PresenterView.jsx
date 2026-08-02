import React, { useState, useEffect } from 'react';
import { BookOpen, Globe, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';

const InstructionPresenterView = ({ slide, presentation }) => {
  const { t } = useTranslation();
  const [qrSize, setQrSize] = useState(115);

  useEffect(() => {
    const updateQrSize = () => {
      setQrSize(window.innerWidth < 640 ? 95 : 115);
    };
    updateQrSize();
    window.addEventListener('resize', updateQrSize);
    return () => window.removeEventListener('resize', updateQrSize);
  }, []);

  // Get the presentation access code
  const accessCode = presentation?.accessCode || '000000';

  // Display domain - clean production domain fallback if on localhost
  const displayDomain = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'www.inavora.com'
    : (window.location.host || 'www.inavora.com');

  // Construct the URL for joining the presentation
  const joinUrl = `${window.location.origin}/join/${btoa(accessCode)}`;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-start p-2 sm:p-3 font-sans">
      {/* Slide Header */}
      <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
        <div className="p-1.5 sm:p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-2xs">
          <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-ink tracking-tight">
          {t('slide_editors.instruction.presenter_title') || 'Instructions'}
        </h2>
      </div>

      {/* Main 2-Column Cards Grid */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {/* Left Card - Join via Website */}
        <div className="flex flex-col items-center justify-between p-4 sm:p-5 bg-surface rounded-2xl border border-hairline shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col items-center text-center">
            <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
              <Globe className="w-4 h-4" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-ink mb-1.5">
              {t('slide_editors.instruction.presenter_join_via_website_title') || 'Join via Website'}
            </h3>
            <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed mb-4">
              {t('slide_editors.instruction.presenter_join_via_website_description', { website: displayDomain })}
            </p>
          </div>

          <div className="w-full">
            <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl py-2.5 px-3 mb-1.5 text-center">
              <p className="text-2xl sm:text-3xl font-black text-indigo-600 tracking-widest font-mono">
                {accessCode}
              </p>
            </div>
            <p className="text-[11px] text-ink-muted text-center font-medium">
              {t('slide_editors.instruction.presenter_access_code_label') || 'This is the access code for your presentation'}
            </p>
          </div>
        </div>

        {/* Right Card - Scan QR Code */}
        <div className="flex flex-col items-center justify-between p-4 sm:p-5 bg-surface rounded-2xl border border-hairline shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col items-center text-center">
            <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
              <QrCode className="w-4 h-4" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-ink mb-1.5">
              {t('slide_editors.instruction.presenter_scan_qr_code_title') || 'Scan QR Code'}
            </h3>
            <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed mb-3">
              {t('slide_editors.instruction.presenter_scan_qr_code_description') || 'Participants can scan this QR code to join directly'}
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="p-2.5 bg-white border border-gray-200 rounded-xl shadow-xs">
              <QRCodeSVG value={joinUrl} size={qrSize} level={'H'} includeMargin={false} />
            </div>
            <p className="text-[11px] text-ink-muted text-center font-medium mt-2">
              {t('slide_editors.instruction.presenter_qr_code_redirect') || 'QR code automatically directs to this presentation'}
            </p>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-4 sm:mt-5 text-center text-xs text-ink-muted font-medium">
        <p>{t('slide_editors.instruction.presenter_name_prompt') || 'Participants who are not signed in will be prompted to enter their name before joining.'}</p>
      </div>
    </div>
  );
};

export default InstructionPresenterView;