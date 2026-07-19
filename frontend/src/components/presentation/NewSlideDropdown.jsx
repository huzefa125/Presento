import { BarChart3, Cloud, MessageSquare, Sliders, HelpCircle, Grid2X2, MapPin, ChartBarDecreasing, MessagesSquare, SquareStack, Brain, Type, Image, Video, BookOpen, FileText, Monitor, Palette, File } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { getEffectivePlan } from '../../utils/subscriptionUtils';

const NewSlideDropdown = ({ onSelectType, onClose, isHorizontal = false, user, onHoverType }) => {
  const { t } = useTranslation();

  // Check if user is on a free plan (using effective plan to check expiry)
  const effectivePlan = getEffectivePlan(user?.subscription);
  const isFreePlan = !user || effectivePlan === 'free';

  // Define restricted slide types for free users
  const restrictedSlideTypes = ['miro', 'powerpoint', 'google_slides', 'pdf'];

  // Function to handle slide type selection
  const handleSelectType = (type) => {
    // Check if user is on free plan and trying to create a restricted slide
    if (isFreePlan && restrictedSlideTypes.includes(type)) {
      const message = t('toasts.presentation.upgrade_to_create_slide');
      toast.error(message);
      return;
    }

    onSelectType(type);
  };

  const handleHover = (item) => {
    if (onHoverType) onHoverType(item);
  };

  const slideTypes = [
    {
      category: t('new_slide_dropdown.present_your_content'),
      items: [
        { type: 'text', label: t('new_slide_dropdown.text_slide'), icon: Type, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { type: 'image', label: t('new_slide_dropdown.image_slide'), icon: Image, color: 'text-green-500', bg: 'bg-green-500/10' },
        { type: 'video', label: t('new_slide_dropdown.video_slide'), icon: Video, color: 'text-red-500', bg: 'bg-red-500/10' },
        { type: 'instruction', label: t('new_slide_dropdown.instruction_slide'), icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-500/10' },
      ]
    },
    {
      category: t('new_slide_dropdown.engage_your_audience'),
      items: [
        { type: 'multiple_choice', label: t('new_slide_dropdown.choose_one'), icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-500/10' },
        { type: 'quiz', label: t('new_slide_dropdown.quiz'), icon: Brain, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
        { type: 'word_cloud', label: t('new_slide_dropdown.live_word_cloud'), icon: Cloud, color: 'text-red-400', bg: 'bg-red-500/10' },
        { type: 'open_ended', label: t('new_slide_dropdown.open_response'), icon: MessageSquare, color: 'text-pink-400', bg: 'bg-pink-500/10' },
        { type: 'scales', label: t('new_slide_dropdown.rating_scale'), icon: Sliders, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { type: 'ranking', label: t('new_slide_dropdown.rank_the_options'), icon: ChartBarDecreasing, color: 'text-green-600', bg: 'bg-green-500/10' },
        { type: 'qna', label: t('new_slide_dropdown.audience_questions'), icon: MessagesSquare, color: 'text-pink-400', bg: 'bg-pink-500/10' },
        { type: 'guess_number', label: t('new_slide_dropdown.number_guess_challenge'), icon: HelpCircle, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
        { type: 'hundred_points', label: t('new_slide_dropdown.points_allocation'), icon: SquareStack, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { type: '2x2_grid', label: t('new_slide_dropdown.opinion_matrix'), icon: Grid2X2, color: 'text-red-400', bg: 'bg-red-500/10' },
        { type: 'pin_on_image', label: t('new_slide_dropdown.spot_on_image'), icon: MapPin, color: 'text-blue-700', bg: 'bg-blue-500/10' },
      ]
    },
    {
      category: t('new_slide_dropdown.challenge_mode'),
      items: [
        { type: 'pick_answer', label: t('new_slide_dropdown.pick_the_answer'), icon: HelpCircle, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { type: 'type_answer', label: t('new_slide_dropdown.type_your_answer'), icon: MessageSquare, color: 'text-green-500', bg: 'bg-green-500/10' },
      ]
    },
    {
      category: t('new_slide_dropdown.bring_your_slides_in'),
      items: [
        {
          type: 'miro',
          label: t('new_slide_dropdown.import_from_miro', { miroBrand: t('new_slide_dropdown.miro_brand') }),
          icon: Palette,
          color: 'text-purple-500',
          bg: 'bg-purple-500/10',
        },
        {
          type: 'powerpoint',
          label: t('new_slide_dropdown.import_powerpoint', { powerpointBrand: t('new_slide_dropdown.powerpoint_brand') }),
          icon: FileText,
          color: 'text-green-500',
          bg: 'bg-green-500/10',
        },
        {
          type: 'google_slides',
          label: t('new_slide_dropdown.import_from_google_slides', { googleSlidesBrand: t('new_slide_dropdown.google_slides_brand') }),
          icon: Monitor,
          color: 'text-blue-500',
          bg: 'bg-blue-500/10',
        },
        {
          type: 'pdf',
          label: t('new_slide_dropdown.import_pdf'),
          icon: File,
          color: 'text-red-500',
          bg: 'bg-red-500/10',
        },
      ]
    },
  ];

  useEffect(() => {
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    // Cleanup function to restore overflow when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div
      className={`${isHorizontal ? 'relative' : 'absolute left-0 sm:left-3 top-16'} w-full sm:w-80`}
      onMouseLeave={() => handleHover(null)}
    >
      <div className="bg-surface rounded-lg shadow-[var(--shadow-level-1)] border border-hairline z-50 max-h-[min(560px,calc(100vh-8rem))] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between px-4 py-3 border-b border-hairline sticky top-0 bg-surface z-10">
          <h2 className="text-sm font-semibold text-ink">{t('new_slide_dropdown.add_slide')}</h2>
          <button
            onClick={onClose}
            className="p-1 text-ink-muted hover:text-ink hover:bg-canvas-soft rounded-md transition"
            aria-label={t('new_slide_dropdown.close')}
          >
            <span className="block h-4 w-4 leading-4 text-center text-base">×</span>
          </button>
        </div>

        <div className="py-2">
          {slideTypes.map((category, idx) => (
            <div key={idx} className={idx > 0 ? 'mt-2 pt-2 border-t border-hairline' : ''}>
              <h3 className="px-4 py-1.5 text-[11px] font-semibold text-ink-faint uppercase tracking-wide">
                {category.category}
              </h3>
              <div className="px-2">
                {category.items.map((item) => {
                  const Icon = item.icon;
                  const isRestricted = isFreePlan && restrictedSlideTypes.includes(item.type);

                  return (
                    <button
                      key={item.type}
                      onClick={() => handleSelectType(item.type)}
                      onMouseEnter={() => handleHover(item)}
                      onFocus={() => handleHover(item)}
                      className={`w-full flex items-center gap-3 px-2 py-2 rounded-md transition-colors text-left ${isRestricted
                        ? 'cursor-not-allowed opacity-60'
                        : 'hover:bg-canvas-soft'}`}
                    >
                      <span className={`flex items-center justify-center h-8 w-8 rounded-md shrink-0 ${item.bg}`}>
                        <Icon className={`h-4 w-4 ${item.color}`} />
                      </span>
                      <span className={`text-sm ${isRestricted ? 'text-ink-faint' : 'text-ink'}`}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NewSlideDropdown;
