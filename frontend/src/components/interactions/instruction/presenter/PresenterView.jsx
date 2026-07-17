import React, { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';

const InstructionPresenterView = ({ slide, presentation }) => {
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
          <div className="flex items-center justify-center mb-4 sm:mb-6">
            <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-teal-500 mr-2 sm:mr-3" />
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
              {t('slide_editors.instruction.presenter_title')}
            </h2>
          </div>
          
          <div className="bg-[#1F1F1F] rounded-xl overflow-hidden border border-[#3B3B3B] shadow-lg p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
              {/* Left Column - Website and Access Code */}
              <div className="flex flex-col items-center justify-center p-4 sm:p-6 bg-[#2A2A2A] rounded-lg">
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4 text-center">
                  {t('slide_editors.instruction.presenter_join_via_website_title')}
                </h3>
                <p className="text-sm sm:text-base text-gray-300 mb-3 sm:mb-4 text-center px-2">
                  {t('slide_editors.instruction.presenter_join_via_website_description')}
                </p>
                <div className="bg-[#1A1A1A] rounded-lg p-3 sm:p-4 mb-3 sm:mb-4 w-full">
                  <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-teal-400 tracking-wider text-center break-all">
                    {accessCode}
                  </p>
                </div>
                <div className="text-xs sm:text-sm text-gray-400 text-center px-2">
                  <p>{t('slide_editors.instruction.presenter_access_code_label')}</p>
                </div>
              </div>
              
              {/* Right Column - QR Code */}
              <div className="flex flex-col items-center justify-center p-4 sm:p-6 bg-[#2A2A2A] rounded-lg">
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4 text-center">
                  {t('slide_editors.instruction.presenter_scan_qr_code_title')}
                </h3>
                <p className="text-sm sm:text-base text-gray-300 mb-3 sm:mb-4 text-center px-2">
                  {t('slide_editors.instruction.presenter_scan_qr_code_description')}
                </p>
                <div className="bg-white p-2 sm:p-4 rounded-lg flex-shrink-0">
                  <QRCodeSVG 
                    value={joinUrl} 
                    size={qrSize} 
                    level={'H'} 
                    includeMargin={true}
                  />
                </div>
                <div className="text-xs sm:text-sm text-gray-400 text-center mt-2 sm:mt-3 px-2">
                  <p>{t('slide_editors.instruction.presenter_qr_code_redirect')}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-400 px-2">
              <p>
                {t('slide_editors.instruction.presenter_name_prompt')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructionPresenterView;