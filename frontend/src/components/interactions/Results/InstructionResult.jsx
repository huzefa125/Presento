import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import { Globe, QrCode } from 'lucide-react';

const InstructionResult = ({ slide, data, presentation }) => {
  const { t } = useTranslation();
  const accessCode = presentation?.accessCode || '000000';

  const displayDomain = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'www.inavora.com'
    : (window.location.host || 'www.inavora.com');

  let joinUrl = '';
  try {
    joinUrl = `${window.location.origin}/join/${btoa(accessCode)}`;
  } catch (e) {
    console.error('Error encoding access code:', e);
    joinUrl = `${window.location.origin}/join/`;
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column - Website and Access Code */}
        <div className="flex flex-col items-center justify-between p-6 bg-surface rounded-2xl border border-hairline shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-ink mb-2">
              {t('slide_editors.instruction.join_via_website_title') || 'Join via Website'}
            </h3>
            <p className="text-sm text-ink-secondary leading-relaxed mb-6 text-center">
              {t('slide_editors.instruction.join_via_website_description', { website: displayDomain })}
            </p>
          </div>

          <div className="w-full">
            <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl py-3.5 px-4 text-center">
              <p className="text-3xl font-black text-indigo-600 tracking-widest font-mono">
                {accessCode}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column - QR Code */}
        <div className="flex flex-col items-center justify-between p-6 bg-surface rounded-2xl border border-hairline shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-ink mb-2">
              {t('slide_editors.instruction.scan_qr_code_title') || 'Scan QR Code'}
            </h3>
            <p className="text-sm text-ink-secondary leading-relaxed mb-4 text-center">
              {t('slide_editors.instruction.scan_qr_code_description') || 'Scan QR code to join directly'}
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-xs">
              <QRCodeSVG value={joinUrl} size={128} level={'H'} includeMargin={false} />
            </div>
            <p className="text-xs text-ink-muted text-center font-medium mt-3">
              {t('slide_editors.instruction.scan_to_join_directly') || 'Scan to join directly'}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-ink-muted font-medium">
        <p>{t('slide_editors.instruction.when_scanned_description')}</p>
      </div>
    </div>
  );
};

export default InstructionResult;