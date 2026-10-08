import { useTranslation } from 'react-i18next';
import MCQResult from '../interactions/Results/MCQResult';
import CompareSlidesResult from '../interactions/Results/CompareSlidesResult';
import WordCloudResult from '../interactions/Results/WordCloudResult';
import OpenEndedResult from '../interactions/Results/OpenEndedResult';
import ScalesResult from '../interactions/Results/ScalesResult';
import RankingResult from '../interactions/Results/RankingResult';
import HundredPointsResult from '../interactions/Results/HundredPointsResult';
import QuizResult from '../interactions/Results/QuizResult';
import LeaderboardResult from '../interactions/Results/LeaderboardResult';
import QnaResult from '../interactions/Results/QnaResult';
import GuessNumberResult from '../interactions/Results/GuessNumberResult';
import GridResult from '../interactions/Results/GridResult';
import PinOnImageResult from '../interactions/Results/PinOnImageResult';
import PickAnswerResult from '../interactions/Results/PickAnswerResult';
import TypeAnswerResult from '../interactions/Results/TypeAnswerResult';
import MiroResult from '../interactions/Results/MiroResult';
import PowerPointResult from '../interactions/Results/PowerPointResult';
import GoogleSlidesResult from '../interactions/Results/GoogleSlidesResult';
import InstructionResult from '../interactions/Results/InstructionResult';
import TextResult from '../interactions/Results/TextResult';
import ImageResult from '../interactions/Results/ImageResult';
import VideoResult from '../interactions/Results/VideoResult';

/**
 * Looks up one slide's results out of the full results map (handling the
 * ID-format/ObjectId-vs-string mismatches the backend can produce, plus the
 * synthetic "virtual-final-leaderboard" slide) and renders the matching
 * per-slide-type Result component. Split out of PresentationResults.jsx
 * (where this was getSlideResults + a 21-case renderSlideResult switch);
 * see CODE_STANDARDS.md.
 */
export default function SlideResultRenderer({ slide, results, presentation }) {
    const { t } = useTranslation();

    const getSlideResults = (slide) => {
        if (!results) {
            console.warn('getSlideResults: No results available');
            return {};
        }
        
        // Handle virtual final leaderboard
        if (slide.id === 'virtual-final-leaderboard' || slide._id === 'virtual-final-leaderboard') {
            // Try to get final leaderboard data from results
            // The backend should provide this in the results
            const finalLeaderboardKey = 'final-leaderboard';
            return results[finalLeaderboardKey] || results['virtual-final-leaderboard'] || {};
        }
        
        // Normalize slide ID to string for matching
        // Backend stores results with slide._id.toString() as the key
        const slideId = slide.id || slide._id;
        if (!slideId) {
            console.warn('getSlideResults: Slide has no ID', slide);
            return {};
        }
        
        // Convert to string and try multiple formats
        const slideIdStr = slideId.toString();
        
        // Try exact match first
        if (results[slideIdStr]) {
            return results[slideIdStr];
        }
        
        // Try matching against all keys in results (handle ObjectId vs string mismatches)
        const resultKeys = Object.keys(results);
        const matchingKey = resultKeys.find(key => {
            // Normalize both keys to strings for comparison
            const normalizedKey = key.toString();
            const normalizedSlideId = slideIdStr.toString();
            return normalizedKey === normalizedSlideId;
        });
        
        if (matchingKey) {
            return results[matchingKey];
        }
        
        // If still not found, try with slide._id if it's different from slide.id
        if (slide._id && slide._id !== slide.id) {
            const slideIdStr2 = slide._id.toString();
            if (results[slideIdStr2]) {
                return results[slideIdStr2];
            }
        }
        
        // Only log warning for slide types that are expected to have results
        // Some slide types (image, text, video, instruction) may not have responses
        const slideTypesWithExpectedResults = [
            'multiple_choice', 'word_cloud', 'open_ended', 'scales', 'ranking',
            'hundred_points', 'quiz', 'qna', 'guess_number', '2x2_grid',
            'pin_on_image', 'pick_answer', 'type_answer', 'leaderboard'
        ];
        
        const shouldHaveResults = slideTypesWithExpectedResults.includes(slide.type);
        
        // Only log warning in development mode and for slides that should have results
        if (shouldHaveResults && process.env.NODE_ENV === 'development') {
            console.debug('getSlideResults: No results found for slide', {
                slideId: slideIdStr,
                slideType: slide.type,
                availableResultKeys: resultKeys.slice(0, 5),
                slideIdType: typeof slideId
            });
        }
        
        return {};
    };

    const slideResults = getSlideResults(slide);

    switch (slide.type) {
            case 'multiple_choice':
                return <MCQResult slide={slide} data={slideResults} />;
            case 'compare_slides':
                return <CompareSlidesResult slide={slide} data={slideResults} />;
            case 'word_cloud':
                return <WordCloudResult slide={slide} data={slideResults} />;
            case 'open_ended':
                return <OpenEndedResult slide={slide} data={slideResults} />;
            case 'scales':
                return <ScalesResult slide={slide} data={slideResults} />;
            case 'ranking':
                return <RankingResult slide={slide} data={slideResults} />;
            case 'hundred_points':
                return <HundredPointsResult slide={slide} data={slideResults} />;
            case 'quiz':
                return <QuizResult slide={slide} data={slideResults} />;
            case 'leaderboard':
                return <LeaderboardResult slide={slide} data={slideResults} />;
            case 'qna':
                return <QnaResult slide={slide} data={slideResults} />;
            case 'guess_number':
                return <GuessNumberResult slide={slide} data={slideResults} />;
            case '2x2_grid':
                return <GridResult slide={slide} data={slideResults} />;
            case 'pin_on_image':
                return <PinOnImageResult slide={slide} data={slideResults} />;
            case 'pick_answer':
                return <PickAnswerResult slide={slide} data={slideResults} />;
            case 'type_answer':
                return <TypeAnswerResult slide={slide} data={slideResults} />;
            case 'miro':
                return <MiroResult slide={slide} data={slideResults} />;
            case 'powerpoint':
                return <PowerPointResult slide={slide} data={slideResults} />;
            case 'google_slides':
                return <GoogleSlidesResult slide={slide} data={slideResults} />;
            case 'instruction':
                return <InstructionResult slide={slide} data={slideResults} presentation={presentation} />;
            case 'text':
                return <TextResult slide={slide} data={slideResults} />;
            case 'image':
                return <ImageResult slide={slide} data={slideResults} />;
            case 'video':
                return <VideoResult slide={slide} data={slideResults} />;
            default:
                return (
                    <div className="text-center text-ink-muted py-6 sm:py-8 bg-surface rounded-lg border border-hairline shadow-[var(--shadow-level-1)]">
                        <p className="mb-2 font-medium text-ink text-sm sm:text-base">{typeof slide.question === 'string' ? slide.question : (slide.question?.text || t('presentation_results.untitled_slide'))}</p>
                        <p className="text-xs sm:text-sm text-ink-faint">{t('presentation_results.visualization_coming_soon', { type: slide.type })}</p>
                    </div>
                );
    }
}
