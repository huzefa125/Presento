import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';

const InstructionResult = ({ slide, data, presentation }) => {
  const { t } = useTranslation();
  // Get the presentation access code
  const accessCode = presentation?.accessCode || '000000';
  
  // Construct the URL for joining the presentation
  // We need to encode the access code properly for the join URL
  let joinUrl = '';
  try {
    joinUrl = `${window.location.origin}/join/${btoa(accessCode)}`;
  } catch (e) {
    console.error('Error encoding access code:', e);
    joinUrl = `${window.location.origin}/join/`;
  }

  return (
    <div className="bg-surface rounded-lg overflow-hidden border border-hairline shadow-[var(--shadow-level-1)] p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column - Website and Access Code */}
        <div className="flex flex-col items-center justify-center p-6 bg-canvas-soft rounded-lg border border-hairline">
          <h3 className="text-xl font-semibold text-ink mb-4">{t('slide_editors.instruction.join_via_website_title')}</h3>
          <p className="text-ink-secondary mb-4 text-center">
            {t('slide_editors.instruction.join_via_website_description', { website: 'www.inavora.com' })}
          </p>
          <div className="bg-surface rounded-lg p-4 mb-4 border border-hairline">
            <p className="text-3xl font-bold text-accent-teal tracking-wider">{accessCode}</p>
          </div>
        </div>

        {/* Right Column - QR Code */}
        <div className="flex flex-col items-center justify-center p-6 bg-canvas-soft rounded-lg border border-hairline">
          <h3 className="text-xl font-semibold text-ink mb-4">{t('slide_editors.instruction.scan_qr_code_title')}</h3>
          <p className="text-ink-secondary mb-4 text-center">
            {t('slide_editors.instruction.scan_qr_code_description')}
          </p>
          <div className="bg-surface p-4 rounded-lg border border-hairline">
            <QRCodeSVG
              value={joinUrl}
              size={128}
              level={'H'}
              includeMargin={true}
            />
          </div>
          <p className="text-ink-muted text-sm mt-3 text-center">
            {t('slide_editors.instruction.scan_to_join_directly')}
          </p>
        </div>
      </div>

      <div className="mt-6 text-center text-sm text-ink-muted">
        <p>
          {t('slide_editors.instruction.when_scanned_description')}
        </p>
      </div>
    </div>
  );
};

export default InstructionResult;