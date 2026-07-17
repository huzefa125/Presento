import { BarChart3, Cloud, MessageSquare, Sliders, ChartBarDecreasing, MessagesSquare, CircleQuestionMark, SquareStack, Grid2X2, MapPin, Brain, Trophy, FileText, Monitor, Presentation, Type, Image, Video, BookOpen, File } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const slideTypeConfig = {
  multiple_choice: { labelKey: 'slide_types.multiple_choice', icon: BarChart3, color: 'text-[#2196F3]' },
  word_cloud: { labelKey: 'slide_types.word_cloud', icon: Cloud, color: 'text-[#9C27B0]' },
  open_ended: { labelKey: 'slide_types.open_ended', icon: MessageSquare, color: 'text-[#4CAF50]' },
  scales: { labelKey: 'slide_types.scales', icon: Sliders, color: 'text-[#FF9800]' },
  ranking: { labelKey: 'slide_types.ranking', icon: ChartBarDecreasing, color: 'text-[#E91E63]' },
  qna: { labelKey: 'slide_types.qna', icon: MessagesSquare, color: 'text-[#3F51B5]' },
  guess_number: { labelKey: 'slide_types.guess_number', icon: CircleQuestionMark, color: 'text-[#009688]' },
  hundred_points: { labelKey: 'slide_types.hundred_points', icon: SquareStack, color: 'text-[#FFEB3B]' },
  '2x2_grid': { labelKey: 'slide_types.grid_2x2', icon: Grid2X2, color: 'text-[#00BCD4]' },
  pin_on_image: { labelKey: 'slide_types.pin_on_image', icon: MapPin, color: 'text-[#F44336]' },
  quiz: { labelKey: 'slide_types.quiz', icon: Brain, color: 'text-[#009688]' },
  leaderboard: { labelKey: 'slide_types.leaderboard', icon: Trophy, color: 'text-[#FFC107]' },
  // Present Your Content section
  text: { labelKey: 'slide_types.text', icon: Type, color: 'text-[#2196F3]' },
  image: { labelKey: 'slide_types.image', icon: Image, color: 'text-[#4CAF50]' },
  video: { labelKey: 'slide_types.video', icon: Video, color: 'text-[#F44336]' },
  instruction: { labelKey: 'slide_types.instruction', icon: BookOpen, color: 'text-[#9C27B0]' },
  // Challenge Mode section
  pick_answer: { labelKey: 'slide_types.pick_answer', icon: CircleQuestionMark, color: 'text-[#2196F3]' },
  type_answer: { labelKey: 'slide_types.type_answer', icon: MessageSquare, color: 'text-[#4CAF50]' },
  // Bring Your Slides In section
  miro: { labelKey: 'slide_types.miro', icon: FileText, color: 'text-[#009688]' },
  powerpoint: { labelKey: 'slide_types.powerpoint', icon: Presentation, color: 'text-[#D84315]' },
  google_slides: { labelKey: 'slide_types.google_slides', icon: Monitor, color: 'text-[#4285F4]' },
  pdf: { labelKey: 'slide_types.pdf', icon: File, color: 'text-[#F44336]' }
};

const SlideTypeHeader = ({ type }) => {
  const { t } = useTranslation();
  const config = slideTypeConfig[type] || slideTypeConfig.multiple_choice;
  const Icon = config.icon;

  return (
    <div className="px-4 py-4 border-b border-[#2A2A2A] bg-[#1F1F1F]">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-[#2A2A2A] ${config.color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[#E0E0E0]">{t(config.labelKey)}</h3>
          <p className="text-xs text-[#B0B0B0]">{t('slide_types.edit_settings')}</p>
        </div>
      </div>
    </div>
  );
};

export default SlideTypeHeader;