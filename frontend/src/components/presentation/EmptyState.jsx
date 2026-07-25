import { useTranslation } from 'react-i18next';

// Clean, precise SVGs matching Mentimeter
const ScratchIcon = () => (
  <svg width="44" height="44" viewBox="0 0 36 36" fill="none" className="shrink-0">
    <rect x="4" y="10" width="22" height="22" rx="6" fill="#EDE9FE" />
    <path d="M18 6L26 14L16 24H12V20L22 10Z" fill="#7C3AED" stroke="#EDE9FE" strokeWidth="2" strokeLinejoin="round" />
  </svg>
);

const ImportIcon = () => (
  <svg width="44" height="44" viewBox="0 0 36 36" fill="none" className="shrink-0">
    <path d="M10 10V18C10 21.3137 12.6863 24 16 24H25" stroke="#15803D" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19 18L25 24L19 30" stroke="#15803D" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SparklesCardIcon = () => (
  <svg width="44" height="44" viewBox="0 0 36 36" fill="none" className="shrink-0">
    <path d="M16 4L19 14L29 17L19 20L16 30L13 20L3 17L13 14L16 4Z" fill="#4F46E5" />
    <path d="M27 6L28.5 10.5L33 12L28.5 13.5L27 18L25.5 13.5L21 12L25.5 10.5L27 6Z" fill="#6366F1" opacity="0.85" />
  </svg>
);

const StarBadge = () => (
  <span className="ml-1.5 w-4 h-4 rounded-full bg-[#C7F0DB] text-[#045D3B] inline-flex items-center justify-center text-[9px] shrink-0 font-bold">
    ★
  </span>
);

const EmptyState = ({ onAiGenerate, onStartFromScratch, onImportSlides }) => {
  const { t } = useTranslation();

  return (
    <div className="w-full h-full flex items-center justify-center p-3 sm:p-5 overflow-y-auto custom-scrollbar">
      {/* 3 Mentimeter Selection Cards directly inside single PPT Slide Canvas */}
      <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 items-stretch justify-center my-auto">
        
        {/* Card 1: Start from scratch */}
        <div
          onClick={onStartFromScratch}
          className="bg-white border border-[#E2E8F0] rounded-[20px] p-3.5 sm:p-5 text-left flex flex-col justify-between hover:border-[#6366F1] hover:shadow-md transition-colors cursor-pointer min-h-[140px] sm:min-h-[200px]"
        >
          <div className="flex items-center justify-center my-1 sm:my-2">
            <ScratchIcon />
          </div>
          <div>
            <h3 className="text-xs sm:text-base font-bold text-[#1E293B] mb-0.5 sm:mb-1">
              {t('presentation.start_from_scratch') || 'Start from scratch'}
            </h3>
            <p className="text-[11px] sm:text-xs text-[#64748B] leading-relaxed font-normal">
              {t('presentation.start_scratch_desc') || 'Gain insights with word clouds, polls, quizzes, and more.'}
            </p>
          </div>
        </div>

        {/* Card 2: Import slides */}
        <div
          onClick={() => (onImportSlides ? onImportSlides() : onStartFromScratch())}
          className="bg-white border border-[#E2E8F0] rounded-[20px] p-3.5 sm:p-5 text-left flex flex-col justify-between hover:border-[#15803D] hover:shadow-md transition-colors cursor-pointer min-h-[140px] sm:min-h-[200px]"
        >
          <div className="flex items-center justify-center my-1 sm:my-2">
            <ImportIcon />
          </div>
          <div>
            <h3 className="text-xs sm:text-base font-bold text-[#1E293B] mb-0.5 sm:mb-1 flex items-center">
              <span>{t('presentation.import_slides') || 'Import slides'}</span>
              <StarBadge />
            </h3>
            <p className="text-[11px] sm:text-xs text-[#64748B] leading-relaxed font-normal">
              {t('presentation.import_slides_desc') || 'Upload a Powerpoint, Keynote, or PDF file to Presento.'}
            </p>
          </div>
        </div>

        {/* Card 3: Start with AI */}
        <div
          onClick={() => onAiGenerate && onAiGenerate()}
          className="bg-white border border-[#E2E8F0] rounded-[20px] p-3.5 sm:p-5 text-left flex flex-col justify-between hover:border-[#4F46E5] hover:shadow-md transition-colors cursor-pointer min-h-[140px] sm:min-h-[200px]"
        >
          <div className="flex items-center justify-center my-1 sm:my-2">
            <SparklesCardIcon />
          </div>
          <div>
            <h3 className="text-xs sm:text-base font-bold text-[#1E293B] mb-0.5 sm:mb-1">
              {t('presentation.start_with_ai') || 'Start with AI'}
            </h3>
            <p className="text-[11px] sm:text-xs text-[#64748B] leading-relaxed font-normal">
              {t('presentation.start_ai_desc') || 'Use AI to build personalized quizzes, polls and surveys!'}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default EmptyState;
