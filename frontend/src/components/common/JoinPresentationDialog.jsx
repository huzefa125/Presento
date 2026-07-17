// eslint-disable-next-line
import { motion, AnimatePresence } from "framer-motion";
import { Play } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';

// Function to convert English digits to localized digits
const convertToLocalizedDigits = (text, language) => {
  if (!text) return text;
  
  const digitMap = {
    'en': { '0': '0', '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9' },
    'hi': { '0': '०', '1': '१', '2': '२', '3': '३', '4': '४', '5': '५', '6': '६', '7': '७', '8': '८', '9': '९' },
    'ta': { '0': '௦', '1': '௧', '2': '௨', '3': '௩', '4': '௪', '5': '௫', '6': '௬', '7': '௭', '8': '௮', '9': '௯' },
    'te': { '0': '౦', '1': '౧', '2': '౨', '3': '౩', '4': '౪', '5': '౫', '6': '౬', '7': '౭', '8': '౮', '9': '౯' },
    'bn': { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' },
    'mr': { '0': '०', '1': '१', '2': '२', '3': '३', '4': '४', '5': '५', '6': '६', '7': '७', '8': '८', '9': '९' }
  };
  
  const map = digitMap[language] || digitMap['en'];
  return text.replace(/[0-9]/g, (digit) => map[digit] || digit);
};

// Function to convert localized digits back to English digits
const convertToEnglishDigits = (text, language) => {
  if (!text) return text;
  
  const reverseMap = {
    'en': { '0': '0', '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9' },
    'hi': { '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9' },
    'ta': { '௦': '0', '௧': '1', '௨': '2', '௩': '3', '௪': '4', '௫': '5', '௬': '6', '௭': '7', '௮': '8', '௯': '9' },
    'te': { '౦': '0', '౧': '1', '౨': '2', '౩': '3', '౪': '4', '౫': '5', '౬': '6', '౭': '7', '౮': '8', '౯': '9' },
    'bn': { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' },
    'mr': { '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9' }
  };
  
  const map = reverseMap[language] || reverseMap['en'];
  return text.replace(/[0-9०-९௦-௯౦-౯০-৯]/g, (digit) => map[digit] || digit);
};

export const JoinPresentationDialog = ({ onCancel }) => {
    
    const [accessCode, setAccessCode] = useState('');
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    
    // Get current language
    const currentLanguage = i18n.language.split('-')[0]; // Get base language (e.g., 'en' from 'en-US')

    const joinPresentation = ()=> {
    // Convert localized digits back to English before processing
    const englishCode = convertToEnglishDigits(accessCode, currentLanguage);
    if (englishCode.length !== 6) {
      toast.error(t('join_presentation.access_code_length_error'));
      return;
    }
    
    if (!/^\d+$/.test(englishCode)) {
      toast.error(t('join_presentation.access_code_numeric_error'));
      return;
    }
    
    navigate(`/join/${btoa(englishCode)}`);
  }
  
  return (
      <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={() => onCancel(false)}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-md bg-slate-800 border border-white/10 rounded-2xl shadow-2xl p-8 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-teal-500 to-orange-500" />

          <h2 className="text-2xl font-bold text-white mb-2">{t('join_presentation.join_presentation_title')}</h2>
          <p className="text-gray-400 mb-8">{t('join_presentation.enter_access_code')}</p>

          <div className="space-y-6">
            <input
              type="text"
              value={convertToLocalizedDigits(accessCode, currentLanguage)}
              onChange={(e) => {
                // Convert localized digits back to English for storage
                const englishDigits = convertToEnglishDigits(e.target.value, currentLanguage);
                // Only allow alphanumeric characters and limit to 6 characters
                if (englishDigits.length <= 6) {
                  setAccessCode(englishDigits.toUpperCase());
                }
              }}
              placeholder={convertToLocalizedDigits("000 000", currentLanguage)}
              onKeyDown={(e)=> e.key === 'Enter' && joinPresentation()}
              maxLength={6}
              className="w-full px-4 py-4 text-center text-3xl font-mono tracking-[0.5em] bg-slate-900 border-2 border-slate-700 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/20 text-white placeholder-slate-700 transition-all"
              autoFocus
            />

            <div className="flex gap-4">
              <button
                onClick={() => {
                  onCancel(false);
                  setAccessCode('');
                }}
                className="flex-1 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors font-medium"
              >
                {t('join_presentation.cancel')}
              </button>
              <button
                onClick={joinPresentation}
                disabled={accessCode.length !== 6}
                className="flex-1 px-4 py-3 text-white bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all font-bold shadow-lg shadow-teal-500/20"
              >
                {t('join_presentation.join_now')}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export const JoinPresentationBtn = ({ onClick, variant }) => {
    const { t } = useTranslation();
    const LandingBtn = "w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 font-bold text-lg text-white hover:shadow-lg hover:shadow-teal-500/30 transition-all flex items-center justify-center gap-2 group";
    const DashBoardBtn = "w-full md:w-auto bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-teal-500/25 transition-all flex items-center justify-center gap-2"
    return (
       <button
         onClick={() => onClick(true)}
         className= {variant === "dashboard" ? DashBoardBtn : LandingBtn}
         >
            {t('join_presentation.join_a_presentation')}
            <Play className="w-4 h-4 mt-1 fill-current" />
        </button>
    )
}