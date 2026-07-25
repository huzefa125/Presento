import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { HelpCircle, X, Download } from 'lucide-react';
import { getEffectivePlan } from '../../utils/subscriptionUtils';

// Custom Mentimeter-Exact SVG Icons
const MultipleChoiceIcon = () => (
  <svg width="22" height="22" viewBox="0 0 20 20" fill="none" className="shrink-0">
    <rect x="3" y="11" width="5" height="6" rx="1.5" fill="#4F46E5" />
    <rect x="11" y="4" width="5" height="13" rx="1.5" fill="#4F46E5" />
  </svg>
);

const WordCloudIcon = () => (
  <svg width="22" height="22" viewBox="0 0 20 20" fill="none" className="shrink-0">
    <path d="M7 6C5.34315 6 4 7.34315 4 9C4 9.5 4.15 9.95 4.4 10.33C3.55 10.75 3 11.6 3 12.6C3 13.9 4.1 15 5.4 15H15C16.1 15 17 14.1 17 13C17 12.1 16.4 11.3 15.6 11.08C15.85 10.6 16 10.05 16 9.5C16 7.6 14.4 6 12.5 6C12.1 6 11.7 6.1 11.35 6.25C10.75 5.5 9.8 5 8.75 5C8.1 5 7.5 5.2 7 5.5V6Z" fill="#FF6565" />
  </svg>
);

const OpenEndedIcon = () => (
  <svg width="22" height="22" viewBox="0 0 20 20" fill="none" className="shrink-0">
    <path d="M4 5C4 3.9 4.9 3 6 3H14C15.1 3 16 3.9 16 5V11C16 12.1 15.1 13 14 13H7.5L4.7 15.6C4.3 16 3.6 15.7 3.6 15.1V13.8C3.8 13.5 4 12.5 4 12.5V5Z" fill="#FF9580" />
  </svg>
);

const ScalesIcon = () => (
  <svg width="22" height="22" viewBox="0 0 20 20" fill="none" className="shrink-0">
    <path d="M7 4H13V16H7V4Z" fill="#6366F1" opacity="0.35" />
    <path d="M4 7C4 5.9 4.9 5 6 5H14C15.1 5 16 5.9 16 7V13C16 14.1 15.1 15 14 15H6C4.9 15 4 14.1 4 13V7Z" fill="#6366F1" />
  </svg>
);

const RankingIcon = () => (
  <svg width="22" height="22" viewBox="0 0 20 20" fill="none" className="shrink-0">
    <rect x="3" y="4" width="6" height="12" rx="1.5" fill="#40B375" />
    <rect x="11" y="4" width="6" height="6" rx="1.5" fill="#40B375" />
  </svg>
);

const QnaIcon = () => (
  <svg width="22" height="22" viewBox="0 0 20 20" fill="none" className="shrink-0">
    <circle cx="8" cy="8" r="5" fill="#FF9999" />
    <circle cx="13" cy="13" r="4" fill="#FFB3B3" />
  </svg>
);

const GuessNumberIcon = () => (
  <svg width="22" height="22" viewBox="0 0 20 20" fill="none" className="shrink-0">
    <text x="5" y="15" fill="#D97706" fontSize="16" fontWeight="bold">?</text>
  </svg>
);

const HundredPointsIcon = () => (
  <svg width="22" height="22" viewBox="0 0 20 20" fill="none" className="shrink-0">
    <rect x="3" y="4" width="14" height="3" rx="1" fill="#4F46E5" />
    <rect x="3" y="9" width="10" height="3" rx="1" fill="#4F46E5" opacity="0.65" />
    <rect x="3" y="14" width="6" height="3" rx="1" fill="#4F46E5" opacity="0.35" />
  </svg>
);

const Grid2x2Icon = () => (
  <svg width="22" height="22" viewBox="0 0 20 20" fill="none" className="shrink-0">
    <rect x="3" y="3" width="6" height="6" rx="1.5" fill="#FF6565" />
    <rect x="11" y="11" width="6" height="6" rx="1.5" fill="#FF6565" />
    <rect x="11" y="3" width="6" height="6" rx="1.5" fill="#FF6565" opacity="0.35" />
    <rect x="3" y="11" width="6" height="6" rx="1.5" fill="#FF6565" opacity="0.35" />
  </svg>
);

const PinOnImageIcon = () => (
  <svg width="22" height="22" viewBox="0 0 20 20" fill="none" className="shrink-0">
    <path d="M10 2C6.7 2 4 4.7 4 8C4 12.5 10 18 10 18C10 18 16 12.5 16 8C16 4.7 13.3 2 10 2ZM10 10.5C8.6 10.5 7.5 9.4 7.5 8C7.5 6.6 8.6 5.5 10 5.5C11.4 5.5 12.5 6.6 12.5 8C12.5 9.4 11.4 10.5 10 10.5Z" fill="#7C3AED" />
  </svg>
);

const SelectAnswerIcon = () => (
  <svg width="22" height="22" viewBox="0 0 20 20" fill="none" className="shrink-0">
    <rect x="4" y="4" width="4" height="12" rx="1.5" fill="#6366F1" />
    <rect x="12" y="8" width="4" height="8" rx="1.5" fill="#6366F1" opacity="0.45" />
  </svg>
);

const TypeAnswerIcon = () => (
  <svg width="22" height="22" viewBox="0 0 20 20" fill="none" className="shrink-0">
    <path d="M6 4H14M10 4V16M7 16H13" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const TextIcon = () => (
  <svg width="22" height="22" viewBox="0 0 20 20" fill="none" className="shrink-0">
    <path d="M6 4H14M10 4V16M7 16H13" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const ImageIcon = () => (
  <svg width="22" height="22" viewBox="0 0 20 20" fill="none" className="shrink-0">
    <path d="M3 15L8 9L12 14L15 11L17 15H3Z" fill="#3B82F6" />
    <circle cx="6" cy="6" r="2" fill="#3B82F6" />
  </svg>
);

const VideoIcon = () => (
  <svg width="22" height="22" viewBox="0 0 20 20" fill="none" className="shrink-0">
    <path d="M6 4L16 10L6 16V4Z" fill="#6366F1" />
  </svg>
);

const InstructionsIcon = () => (
  <svg width="22" height="22" viewBox="0 0 20 20" fill="none" className="shrink-0">
    <rect x="3" y="3" width="6" height="6" rx="1" fill="#6B7280" />
    <rect x="11" y="3" width="6" height="6" rx="1" fill="#6B7280" />
    <rect x="3" y="11" width="6" height="6" rx="1" fill="#6B7280" />
    <rect x="11" y="11" width="6" height="6" rx="1" fill="#6B7280" />
  </svg>
);

const GoogleSlidesIcon = () => (
  <svg width="22" height="22" viewBox="0 0 20 20" fill="none" className="shrink-0">
    <rect x="3" y="3" width="14" height="14" rx="2.5" fill="#F59E0B" />
    <rect x="6" y="6" width="8" height="8" rx="1" fill="white" opacity="0.85" />
  </svg>
);

const PowerpointIcon = () => (
  <svg width="22" height="22" viewBox="0 0 20 20" fill="none" className="shrink-0">
    <rect x="3" y="3" width="14" height="14" rx="2.5" fill="#EA580C" />
    <text x="7" y="14" fill="white" fontSize="11" fontWeight="bold" fontFamily="sans-serif">P</text>
  </svg>
);

const MiroIcon = () => (
  <svg width="22" height="22" viewBox="0 0 20 20" fill="none" className="shrink-0">
    <rect x="3" y="3" width="14" height="14" rx="2.5" fill="#EAB308" />
    <path d="M6 7L8 13L10 8L12 13L14 7" stroke="black" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CompareSlidesIcon = () => (
  <svg width="22" height="22" viewBox="0 0 20 20" fill="none" className="shrink-0">
    <circle cx="8" cy="10" r="5" fill="#10B981" />
    <circle cx="12" cy="10" r="5" fill="#10B981" opacity="0.6" />
  </svg>
);

const StarBadge = () => (
  <span className="ml-2 w-5 h-5 rounded-full bg-[#C7F0DB] text-[#045D3B] flex items-center justify-center text-[10px] shrink-0 font-bold">
    ★
  </span>
);

const NewSlideDropdown = ({ onSelectType, onClose, isHorizontal = false, user, onHoverType }) => {
  const { t } = useTranslation();

  const effectivePlan = getEffectivePlan(user?.subscription);
  const isFreePlan = !user || effectivePlan === 'free';
  const restrictedSlideTypes = ['miro', 'powerpoint', 'google_slides', 'pdf'];

  const handleSelectType = (type) => {
    if (isFreePlan && restrictedSlideTypes.includes(type)) {
      toast.error(t('toasts.presentation.upgrade_to_create_slide'));
      return;
    }
    onSelectType(type);
  };

  const handleHover = (item) => {
    if (onHoverType) onHoverType(item);
  };

  const slideTypes = [
    {
      category: t('new_slide_dropdown.engage_your_audience') || 'Interactive questions',
      items: [
        { type: 'multiple_choice', label: t('new_slide_dropdown.choose_one') || 'Multiple Choice', icon: MultipleChoiceIcon },
        { type: 'word_cloud', label: t('new_slide_dropdown.live_word_cloud') || 'Word Cloud', icon: WordCloudIcon },
        { type: 'open_ended', label: t('new_slide_dropdown.open_response') || 'Open Ended', icon: OpenEndedIcon },
        { type: 'scales', label: t('new_slide_dropdown.rating_scale') || 'Scales', icon: ScalesIcon },
        { type: 'ranking', label: t('new_slide_dropdown.rank_the_options') || 'Ranking', icon: RankingIcon },
        { type: 'qna', label: t('new_slide_dropdown.audience_questions') || 'Q&A', icon: QnaIcon },
        { type: 'guess_number', label: t('new_slide_dropdown.number_guess_challenge') || 'Guess the Number', icon: GuessNumberIcon },
        { type: 'hundred_points', label: t('new_slide_dropdown.points_allocation') || '100 Points', icon: HundredPointsIcon },
        { type: '2x2_grid', label: t('new_slide_dropdown.opinion_matrix') || '2 x 2 Grid', icon: Grid2x2Icon },
        { type: 'pin_on_image', label: t('new_slide_dropdown.spot_on_image') || 'Pin on Image', icon: PinOnImageIcon },
      ]
    },
    {
      category: t('new_slide_dropdown.challenge_mode') || 'Quiz competitions',
      items: [
        { type: 'quiz', label: t('new_slide_dropdown.quiz') || 'Select Answer', icon: SelectAnswerIcon },
        { type: 'type_answer', label: t('new_slide_dropdown.type_your_answer') || 'Type Answer', icon: TypeAnswerIcon },
      ]
    },
    {
      category: t('new_slide_dropdown.present_your_content') || 'Content slides',
      items: [
        { type: 'compare_slides', label: 'Compare slides', icon: CompareSlidesIcon, isBeta: true },
        { type: 'text', label: t('new_slide_dropdown.text_slide') || 'Text', icon: TextIcon },
        { type: 'image', label: t('new_slide_dropdown.image_slide') || 'Image', icon: ImageIcon },
        { type: 'video', label: t('new_slide_dropdown.video_slide') || 'Video', icon: VideoIcon },
        { type: 'instruction', label: t('new_slide_dropdown.instruction_slide') || 'Instructions', icon: InstructionsIcon },
      ]
    },
    {
      category: t('new_slide_dropdown.bring_your_slides_in') || 'Integrations',
      items: [
        { type: 'google_slides', label: 'Google Slides', icon: GoogleSlidesIcon, hasStar: true },
        { type: 'powerpoint', label: 'Powerpoint', icon: PowerpointIcon, hasStar: true },
        { type: 'miro', label: 'Miro', icon: MiroIcon, hasStar: true },
      ]
    },
  ];

  useEffect(() => {
    if (window.innerWidth < 768) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, []);

  return (
    <div
      className="fixed inset-0 md:absolute md:inset-auto md:left-3 md:top-16 z-50 flex items-center justify-center md:block p-3 sm:p-4 md:p-0 bg-black/50 md:bg-transparent backdrop-blur-xs md:backdrop-blur-none animate-fadeIn"
      onMouseLeave={() => handleHover(null)}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg md:max-w-none md:w-[440px] bg-white rounded-3xl md:rounded-[28px] shadow-2xl border border-gray-200 max-h-[85vh] md:max-h-[min(620px,calc(100vh-6rem))] flex flex-col relative overflow-hidden animate-fadeIn">
        
        {/* Modal Header - Only on Mobile */}
        <div className="flex md:hidden items-center justify-between px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-20">
          <h3 className="text-base font-bold text-gray-900">Add new slide</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all cursor-pointer"
            aria-label={t('new_slide_dropdown.close') || 'Close'}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Close Button Top-Right for Desktop */}
        <button
          onClick={onClose}
          className="hidden md:block absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all z-30"
          aria-label={t('new_slide_dropdown.close') || 'Close'}
        >
          <X className="h-4 w-4" />
        </button>

        {/* Categories Grid (2-Column Layout) */}
        <div className="space-y-6 flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar pt-4 sm:pt-6">
          {slideTypes.map((category, idx) => (
            <div key={idx}>
              <div className="flex items-center gap-1 mb-2 px-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {category.category}
                </span>
                <HelpCircle className="h-3.5 w-3.5 text-gray-400" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {category.items.map((item) => {
                  const Icon = item.icon;
                  const isRestricted = isFreePlan && restrictedSlideTypes.includes(item.type);

                  return (
                    <button
                      key={item.type}
                      onClick={() => handleSelectType(item.type)}
                      onMouseEnter={() => handleHover(item)}
                      onFocus={() => handleHover(item)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-[#F3F4F6] border border-gray-100 sm:border-transparent transition-all text-left group cursor-pointer ${
                        isRestricted ? 'opacity-70' : ''
                      }`}
                    >
                      <Icon />
                      <span className="text-xs sm:text-sm font-bold text-[#1E293B] flex-1">
                        {item.label}
                      </span>
                      {item.isBeta && (
                        <span className="ml-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-purple-100 text-purple-700 shrink-0">
                          Beta
                        </span>
                      )}
                      {(item.hasStar || isRestricted) && <StarBadge />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sticky Footer Bar (Mentimeter Style Import Slides) */}
        <div className="sticky bottom-0 bg-[#F8FAFC] border-t border-gray-200 px-4 sm:px-5 py-3 flex items-center justify-between z-20">
          <button
            onClick={() => handleSelectType('pdf')}
            className="flex items-center gap-2 text-sm font-bold text-[#1E293B] hover:text-indigo-600 transition-colors cursor-pointer"
          >
            <Download className="h-4 w-4 text-indigo-600" />
            <span>{t('presentation.import_slides') || 'Import slides'}</span>
            <StarBadge />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewSlideDropdown;
