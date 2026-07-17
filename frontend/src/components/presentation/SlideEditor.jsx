import { X, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next'; // Added translation import
import MCQEditor from '../interactions/mcq/Editor';
import WordCloudEditor from '../interactions/wordCloud/Editor';
import OpenEndedEditor from '../interactions/openEnded/Editor';
import ScalesEditor from '../interactions/scales/Editor';
import RankingEditor from '../interactions/ranking/Editor';
import QnaEditor from '../interactions/qna/Editor';
import GuessNumberEditor from '../interactions/guessNumber/Editor';
import HundredPointsEditor from '../interactions/hundredPoints/Editor';
import TwoByTwoGridEditor from '../interactions/twoByTwoGrid/Editor';
import PinOnImageEditor from '../interactions/pinOnImage/Editor';
import QuizEditor from '../interactions/quiz/Editor';
import TextEditor from '../interactions/text/Editor';
import ImageEditor from '../interactions/image/Editor';
import VideoEditor from '../interactions/video/Editor';
import InstructionEditor from '../interactions/instruction/Editor';
import PickAnswerEditor from '../interactions/pickAnswer/Editor';
import TypeAnswerEditor from '../interactions/typeAnswer/Editor';
import MiroEditor from '../interactions/miro/Editor';
import PowerPointEditor from '../interactions/powerpoint/Editor';
import GoogleSlidesEditor from '../interactions/googleSlides/Editor';
import PdfEditor from '../interactions/pdf/Editor';

const SlideEditor = ({ slide, onUpdate, onClose, isOpen }) => {
  const { t } = useTranslation(); // Added translation hook

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}
      <div className={`fixed right-0 top-0 sm:top-17 sm:pb-17 h-full w-full sm:w-96 lg:w-80 bg-[#1F1F1F] border-l border-[#2A2A2A] shadow-[0_10px_30px_rgba(0,0,0,0.6)] z-50 flex flex-col text-[#E0E0E0] transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      {/* Header */}
      <div className="flex-shrink-0 bg-[#1F1F1F] border-b border-[#2A2A2A] p-3 sm:p-4 flex items-center justify-between">
        <h3 className="text-sm sm:text-base font-semibold text-[#E0E0E0]">{t('presentation.slide_settings')}</h3>
        <button
          onClick={onClose}
          className="p-1.5 sm:p-2 hover:bg-[#2A2A2A] active:bg-[#333333] rounded transition-colors text-[#9E9E9E] touch-manipulation"
          aria-label={t('presentation.close_editor')}
        >
          <X className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      </div>

      {/* Content - Render different editors based on slide type */}
      {slide?.type === 'multiple_choice' && !slide?.quizSettings && (
        <MCQEditor slide={slide} onUpdate={onUpdate} />
      )}

      {/* Add other slide type editors here */}
      {slide?.type === 'word_cloud' && (
        <WordCloudEditor slide={slide} onUpdate={onUpdate} />
      )}

      {slide?.type === 'open_ended' && (
        <OpenEndedEditor slide={slide} onUpdate={onUpdate} />
      )}

      {slide?.type === 'scales' && (
        <ScalesEditor slide={slide} onUpdate={onUpdate} />
      )}

      {slide?.type === 'ranking' && (
        <RankingEditor slide={slide} onUpdate={onUpdate} />
      )}

      {slide?.type === 'qna' && (
        <QnaEditor slide={slide} onUpdate={onUpdate} />
      )}

      {slide?.type === 'guess_number' && (
        <GuessNumberEditor slide={slide} onUpdate={onUpdate} />
      )}

      {slide?.type === 'hundred_points' && (
        <HundredPointsEditor slide={slide} onUpdate={onUpdate} />
      )}

      {slide?.type === '2x2_grid' && (
        <TwoByTwoGridEditor slide={slide} onUpdate={onUpdate} />
      )}

      {slide?.type === 'pin_on_image' && (
        <PinOnImageEditor slide={slide} onUpdate={onUpdate} />
      )}

      {(slide?.type === 'quiz' || slide?.quizSettings) && (
        <QuizEditor slide={slide} onUpdate={onUpdate} />
      )}

      {slide?.type === 'text' && (
        <TextEditor slide={slide} onUpdate={onUpdate} />
      )}

      {slide?.type === 'image' && (
        <ImageEditor slide={slide} onUpdate={onUpdate} />
      )}

      {slide?.type === 'video' && (
        <VideoEditor slide={slide} onUpdate={onUpdate} />
      )}

      {slide?.type === 'instruction' && (
        <InstructionEditor slide={slide} onUpdate={onUpdate} />
      )}

      {slide?.type === 'pick_answer' && (
        <PickAnswerEditor slide={slide} onUpdate={onUpdate} />
      )}

      {slide?.type === 'type_answer' && (
        <TypeAnswerEditor slide={slide} onUpdate={onUpdate} />
      )}

      {slide?.type === 'miro' && (
        <MiroEditor slide={slide} onUpdate={onUpdate} />
      )}

      {slide?.type === 'powerpoint' && (
        <PowerPointEditor slide={slide} onUpdate={onUpdate} />
      )}

      {slide?.type === 'google_slides' && (
        <GoogleSlidesEditor slide={slide} onUpdate={onUpdate} />
      )}

      {slide?.type === 'pdf' && (
        <PdfEditor slide={slide} onUpdate={onUpdate} />
      )}

      {slide?.type === 'leaderboard' && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-4">
            <div className="inline-flex p-4 bg-[#2A2A2A] rounded-full">
              <Lock className="h-8 w-8 text-[#FFA726]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#E0E0E0] mb-2">
                {t('presentation.leaderboard_auto_generated_title')}
              </h3>
              <p className="text-sm text-[#9E9E9E] max-w-xs mx-auto">
                {t('presentation.leaderboard_auto_generated_description')}
              </p>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default SlideEditor;
