
import { useTranslation } from 'react-i18next';

const EmptyState = () => {
  const { t } = useTranslation();
  
  return (
    <div className="flex-1 flex flex-col rounded-xl items-center justify-center gap-4 sm:gap-7 p-4 sm:p-8 bg-canvas-soft text-center">
        <h1 className="font-bold text-ink text-2xl sm:text-4xl lg:text-5xl px-4">{t('presentation.empty_state_title')}</h1>
        <h2 className="font-semibold text-ink-muted text-lg sm:text-2xl lg:text-3xl px-4">{t('presentation.empty_state_subtitle')}</h2>
        <div className="px-4 sm:px-6 py-2 rounded-full border border-hairline bg-surface text-accent-green uppercase tracking-wide text-xs sm:text-sm shadow-[var(--shadow-level-1)]">
          {t('presentation.empty_state_ready')}
        </div>
    </div>
  );
};

export default EmptyState;
