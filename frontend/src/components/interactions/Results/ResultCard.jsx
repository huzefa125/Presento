// eslint-disable-next-line
import { motion } from 'framer-motion';
import { BarChart2, MessageSquare, Type, ListOrdered, Target, Grid, MapPin, Trophy, Hash, PieChart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const getTypeConfig = (type, t) => {
    switch (type) {
        case 'multiple_choice': return { label: t('presentation_results.slide_types.multiple_choice'), icon: BarChart2, color: 'text-[#2196F3]', bg: 'bg-[#2196F3]/10' };
        case 'word_cloud': return { label: t('presentation_results.slide_types.word_cloud'), icon: MessageSquare, color: 'text-[#9C27B0]', bg: 'bg-[#9C27B0]/10' };
        case 'open_ended': return { label: t('presentation_results.slide_types.open_ended'), icon: Type, color: 'text-[#4CAF50]', bg: 'bg-[#4CAF50]/10' };
        case 'scales': return { label: t('presentation_results.slide_types.scales'), icon: Target, color: 'text-[#FF9800]', bg: 'bg-[#FF9800]/10' };
        case 'ranking': return { label: t('presentation_results.slide_types.ranking'), icon: ListOrdered, color: 'text-[#FFEB3B]', bg: 'bg-[#FFEB3B]/10' };
        case 'hundred_points': return { label: t('presentation_results.slide_types.hundred_points'), icon: PieChart, color: 'text-[#E91E63]', bg: 'bg-[#E91E63]/10' };
        case '2x2_grid': return { label: t('presentation_results.slide_types.grid'), icon: Grid, color: 'text-[#00BCD4]', bg: 'bg-[#00BCD4]/10' };
        case 'pin_on_image': return { label: t('presentation_results.slide_types.pin_on_image'), icon: MapPin, color: 'text-[#F44336]', bg: 'bg-[#F44336]/10' };
        case 'quiz': return { label: t('presentation_results.slide_types.quiz'), icon: Trophy, color: 'text-[#3F51B5]', bg: 'bg-[#3F51B5]/10' };
        case 'guess_number': return { label: t('presentation_results.slide_types.guess_number'), icon: Hash, color: 'text-[#009688]', bg: 'bg-[#009688]/10' };
        case 'qna': return { label: t('presentation_results.slide_types.qna'), icon: MessageSquare, color: 'text-[#4CAF50]', bg: 'bg-[#4CAF50]/10' };
        case 'leaderboard': return { label: t('presentation_results.slide_types.leaderboard'), icon: Trophy, color: 'text-[#FFC107]', bg: 'bg-[#FFC107]/10' };
        case 'pick_answer': return { label: t('presentation_results.slide_types.pick_answer'), icon: BarChart2, color: 'text-[#2196F3]', bg: 'bg-[#2196F3]/10' };
        case 'type_answer': return { label: t('presentation_results.slide_types.type_answer'), icon: Type, color: 'text-[#4CAF50]', bg: 'bg-[#4CAF50]/10' };
        default: return { label: t('presentation_results.slide_types.slide'), icon: BarChart2, color: 'text-[#B0B0B0]', bg: 'bg-[#B0B0B0]/10' };
    }
};

const ResultCard = ({ slide, totalResponses, children, qnaProp }) => {
    const { t } = useTranslation();
    const { label, icon: Icon, color, bg } = getTypeConfig(slide?.type, t);
    

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-5xl mx-auto mb-12 bg-[#1e293b]/50 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-xl"
        >
            {/* Header */}
            <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <div className="flex items-center gap-2 sm:gap-4">
                    <div className={`p-1.5 sm:p-2 rounded-lg ${bg}`}>
                        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${color}`} />
                    </div>
                    <span className={`text-xs sm:text-sm font-medium ${color} uppercase tracking-wider`}>
                        {label}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-[#B0B0B0] text-xs sm:text-sm">
                    <span className="font-semibold text-[#E0E0E0]">{totalResponses || 0}</span>
                    <span>{t('presentation_results.responses')}</span>
                </div>
            </div>

            {/* Question/Title */}
            <div className={`px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 ${qnaProp && 'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-2'}`}>
                <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-[#E0E0E0] leading-tight">
                    {typeof slide?.question === 'string' 
                        ? slide.question 
                        : (slide?.question?.text || slide?.question?.label || t('presentation_results.untitled_slide'))}
                </h3>
                {qnaProp && 
                <div className="flex justify-center w-full sm:w-auto">
                    <div className="flex p-1 bg-[#2A2A2A] rounded-xl border border-[#2F2F2F]">
                        {['all', 'answered', 'unanswered'].map((f) => (
                            <button
                                key={f}
                                onClick={() => qnaProp.setFilter(f)}
                                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${qnaProp.filter === f
                                    ? 'bg-[#1F1F1F] text-[#E0E0E0] shadow-sm'
                                    : 'text-[#B0B0B0] hover:text-[#E0E0E0]'
                                    }`}
                            >
                                {t(`presentation_results.filters.${f}`)}
                            </button>
                        ))}
                    </div>
                </div>
                }
            </div>

            {/* Content */}
            <div className="px-4 sm:px-6 md:px-8 pb-4 sm:pb-6 md:pb-8">
                {children}
            </div>
        </motion.div>
    );
};

export default ResultCard;
