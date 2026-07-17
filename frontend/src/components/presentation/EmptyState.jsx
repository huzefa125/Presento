
import { useTranslation } from 'react-i18next';

const EmptyState = () => {
  const { t } = useTranslation();
  
  return (
    <div className="flex-1 flex flex-col rounded-2xl items-center justify-center gap-4 sm:gap-7 p-4 sm:p-8 bg-[#1A1A1A] text-center">
        <h1 className="font-bold text-[#E0E0E0] text-2xl sm:text-4xl lg:text-5xl px-4">{t('presentation.empty_state_title')}</h1>
        <h2 className="font-semibold text-[#9E9E9E] text-lg sm:text-2xl lg:text-3xl px-4">{t('presentation.empty_state_subtitle')}</h2>
        <div className="px-4 sm:px-6 py-2 rounded-full border border-[#2F2F2F] bg-[#232323] text-[#4CAF50] uppercase tracking-wide text-xs sm:text-sm shadow-[0_8px_20px_rgba(0,0,0,0.35)]">
          {t('presentation.empty_state_ready')}
        </div>
    </div>
  );
};

export default EmptyState;
