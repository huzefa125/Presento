import { BarChart3, Cloud, MessageSquare, Sliders, HelpCircle, Grid2X2, MapPin, ChartBarDecreasing, MessagesSquare, SquareStack, Brain, Type, Image, Video, BookOpen, FileText, Monitor, Palette, File } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { getEffectivePlan } from '../../utils/subscriptionUtils';

const NewSlideDropdown = ({ onSelectType, onClose, isHorizontal = false, user }) => {
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
  
  const slideTypes = [
    {
      category: t('new_slide_dropdown.present_your_content'),
      items: [
        { type: 'text', label: t('new_slide_dropdown.text_slide'), icon: Type, color: 'text-blue-500' },
        { type: 'image', label: t('new_slide_dropdown.image_slide'), icon: Image, color: 'text-green-500' },
        { type: 'video', label: t('new_slide_dropdown.video_slide'), icon: Video, color: 'text-red-500' },
        { type: 'instruction', label: t('new_slide_dropdown.instruction_slide'), icon: BookOpen, color: 'text-purple-500' },
      ]
    },
    {
      category: t('new_slide_dropdown.engage_your_audience'),
      items: [
        { type: 'multiple_choice', label: t('new_slide_dropdown.choose_one'), icon: BarChart3, color: 'text-blue-600' },
        { type: 'quiz', label: t('new_slide_dropdown.quiz'), icon: Brain, color: 'text-emerald-600' },
        { type: 'word_cloud', label: t('new_slide_dropdown.live_word_cloud'), icon: Cloud, color: 'text-red-400' },
        { type: 'open_ended', label: t('new_slide_dropdown.open_response'), icon: MessageSquare, color: 'text-pink-400' },
        { type: 'scales', label: t('new_slide_dropdown.rating_scale'), icon: Sliders, color: 'text-purple-500' },
        { type: 'ranking', label: t('new_slide_dropdown.rank_the_options'), icon: ChartBarDecreasing, color: 'text-green-600' },
        { type: 'qna', label: t('new_slide_dropdown.audience_questions'), icon: MessagesSquare, color: 'text-pink-400' },
        { type: 'guess_number', label: t('new_slide_dropdown.number_guess_challenge'), icon: HelpCircle, color: 'text-yellow-500' },
        { type: 'hundred_points', label: t('new_slide_dropdown.points_allocation'), icon: SquareStack, color: 'text-blue-500' },
        { type: '2x2_grid', label: t('new_slide_dropdown.opinion_matrix'), icon: Grid2X2, color: 'text-red-400' },
        { type: 'pin_on_image', label: t('new_slide_dropdown.spot_on_image'), icon: MapPin, color: 'text-blue-700' },
      ]
    },
    {
      category: t('new_slide_dropdown.challenge_mode'),
      items: [
        { type: 'pick_answer', label: t('new_slide_dropdown.pick_the_answer'), icon: HelpCircle, color: 'text-blue-500' },
        { type: 'type_answer', label: t('new_slide_dropdown.type_your_answer'), icon: MessageSquare, color: 'text-green-500' },
      ]
    },
    {
      category: t('new_slide_dropdown.bring_your_slides_in'),
      items: [
        { 
          type: 'miro', 
          label: t('new_slide_dropdown.import_from_miro', { miroBrand: t('new_slide_dropdown.miro_brand') }),
          icon: Palette, 
          color: 'text-purple-500'
        },
        { 
          type: 'powerpoint', 
          label: t('new_slide_dropdown.import_powerpoint', { powerpointBrand: t('new_slide_dropdown.powerpoint_brand') }),
          icon: FileText, 
          color: 'text-green-500'
        },
        { 
          type: 'google_slides', 
          label: t('new_slide_dropdown.import_from_google_slides', { googleSlidesBrand: t('new_slide_dropdown.google_slides_brand') }),
          icon: Monitor, 
          color: 'text-blue-500'
        },
        { 
          type: 'pdf', 
          label: t('new_slide_dropdown.import_pdf'),
          icon: File, 
          color: 'text-red-500'
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
    <div className={`${isHorizontal ? 'relative' : 'absolute left-0 sm:left-3 top-16'} w-full sm:w-96`}>
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-0 right-0 p-2 text-[#9E9E9E] bg-[#2A2A2A] hover:bg-[#2A2A2A] rounded-bl-lg transition z-10 hidden sm:block"
      >
        x
      </button>

      <div className="bg-[#1F1F1F] rounded-lg shadow-[0_18px_40px_rgba(0,0,0,0.55)] border border-[#2A2A2A] z-50 max-h-[min(500px,calc(100vh-8rem))] overflow-y-auto custom-scrollbar">
        <div className="p-4 space-y-6">
        {slideTypes.map((category, idx) => (
          <div key={idx}>
            <h3 className="text-xs font-semibold text-[#9E9E9E] mb-3 flex items-center gap-1 uppercase tracking-wide">
              {category.category}
              {(category.category === t('new_slide_dropdown.engage_your_audience') || category.category === t('new_slide_dropdown.present_your_content') || category.category === t('new_slide_dropdown.challenge_mode') || category.category === t('new_slide_dropdown.bring_your_slides_in')) && (
                <HelpCircle className="h-3 w-3 text-[#4CAF50]" />
              )}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {category.items.map((item) => {
                const Icon = item.icon;
                const isRestricted = isFreePlan && restrictedSlideTypes.includes(item.type);
                
                return (
                  <button
                    key={item.type}
                    onClick={() => handleSelectType(item.type)}

                    className={`flex items-center gap-2 p-2 rounded-lg transition-colors text-left border ${isRestricted 
                      ? 'bg-[#242424] border-[#555555] border-dashed cursor-not-allowed opacity-70' 
                      : 'bg-[#242424] hover:bg-[#2E2E2E] border-transparent hover:border-[#4CAF50]/40'}`}
                  >
                    <Icon className={`h-4 w-4 ${item.color}`} />
                    <span className={`text-sm ${isRestricted ? 'text-[#BBBBBB]' : 'text-[#E0E0E0]'}`}>
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