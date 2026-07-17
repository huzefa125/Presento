import { useTranslation } from 'react-i18next';
import { useEffect, useMemo, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../config/api';
import InstructionPresenterView from '../interactions/instruction/presenter/PresenterView';

// Helper component to position the correct area overlay accounting for object-contain letterboxing
const CorrectAreaOverlay = ({ correctArea, imageRef }) => {
  const [overlayStyle, setOverlayStyle] = useState(null);

  useEffect(() => {
    const updateOverlayPosition = () => {
      if (!imageRef.current || !imageRef.current.complete) {
        setOverlayStyle(null);
        return;
      }

      const img = imageRef.current;
      const rect = img.getBoundingClientRect();
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;

      if (naturalWidth === 0 || naturalHeight === 0) {
        setOverlayStyle(null);
        return;
      }

      // Calculate the actual displayed image dimensions (accounting for object-contain)
      const imageAspect = naturalWidth / naturalHeight;
      const containerAspect = rect.width / rect.height;

      let actualImageWidth, actualImageHeight, offsetX, offsetY;

      if (imageAspect > containerAspect) {
        // Image is constrained by width
        actualImageWidth = rect.width;
        actualImageHeight = rect.width / imageAspect;
        offsetX = 0;
        offsetY = (rect.height - actualImageHeight) / 2;
      } else {
        // Image is constrained by height
        actualImageWidth = rect.height * imageAspect;
        actualImageHeight = rect.height;
        offsetX = (rect.width - actualImageWidth) / 2;
        offsetY = 0;
      }

      // Position overlay relative to the actual image area
      setOverlayStyle({
        left: `${offsetX + (correctArea.x / 100) * actualImageWidth}px`,
        top: `${offsetY + (correctArea.y / 100) * actualImageHeight}px`,
        width: `${(correctArea.width / 100) * actualImageWidth}px`,
        height: `${(correctArea.height / 100) * actualImageHeight}px`,
      });
    };

    updateOverlayPosition();

    // Update on window resize
    window.addEventListener('resize', updateOverlayPosition);
    // Update when image loads
    if (imageRef.current) {
      imageRef.current.addEventListener('load', updateOverlayPosition);
    }

    return () => {
      window.removeEventListener('resize', updateOverlayPosition);
      if (imageRef.current) {
        imageRef.current.removeEventListener('load', updateOverlayPosition);
      }
    };
  }, [correctArea, imageRef]);

  if (!overlayStyle) return null;

  return (
    <div
      className="absolute border-2 border-[#4CAF50] bg-[#4CAF50]/10 pointer-events-none"
      style={overlayStyle}
    />
  );
};

// PDF Canvas Preview Component
const PdfCanvasPreview = ({ slide, question, t }) => {
  const pdfPages = slide?.pdfPages || [];
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  // Reset image error when page changes
  useEffect(() => {
    setImageError(false);
  }, [currentPageIndex]);

  if (!pdfPages || pdfPages.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="rounded-3xl border border-[#2F2F2F] bg-[#1F1F1F] shadow-[0_12px_40px_rgba(0,0,0,0.45)] p-4 sm:p-6 lg:p-8">
          <div className="border-b border-[#2A2A2A] px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8 lg:pt-10 pb-4 sm:pb-6">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-[#E0E0E0] text-center">
              {t('slide_editors.pdf.pdf_slide')}
            </h2>
          </div>
          <div className="px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-10">
            <div className="rounded-xl border-2 border-dashed border-[#3A3A3A] bg-[#232323] py-12 sm:py-16 text-center">
              <p className="text-[#9E9E9E]">{t('slide_editors.pdf.upload_pdf_first')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentPage = pdfPages[currentPageIndex];
  const totalPages = pdfPages.length;

  const goToPreviousPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPageIndex < totalPages - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="rounded-3xl border border-[#2F2F2F] bg-[#1F1F1F] shadow-[0_12px_40px_rgba(0,0,0,0.45)] p-4 sm:p-6 lg:p-8">
        <div className="border-b border-[#2A2A2A] px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8 lg:pt-10 pb-4 sm:pb-6 mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-[#E0E0E0] text-center">
            {t('slide_editors.pdf.pdf_slide')}
          </h2>
        </div>
        
        {/* PDF Page Display */}
        <div className="rounded-xl overflow-hidden border border-[#2F2F2F] bg-[#232323] mb-4">
          <div className="flex items-center justify-center min-h-[400px] max-h-[70vh] p-4">
            {currentPage?.imageUrl ? (
              <img 
                src={currentPage.imageUrl} 
                alt={`Page ${currentPage.pageNumber}`}
                className="max-w-full max-h-full object-contain rounded-lg"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div className="hidden items-center justify-center text-[#9E9E9E]">
              <p>{t('slide_editors.pdf.image_load_error')}</p>
            </div>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="bg-[#2A2A2A] rounded-lg border border-[#3B3B3B] p-3 sm:p-4 flex items-center justify-between">
          <button
            onClick={goToPreviousPage}
            disabled={currentPageIndex === 0}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm ${
              currentPageIndex === 0
                ? 'bg-[#3B3B3B] text-[#666666] cursor-not-allowed'
                : 'bg-[#4CAF50] hover:bg-[#43A047] text-white'
            }`}
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">{t('slide_editors.pdf.previous')}</span>
          </button>

          <div className="text-[#E0E0E0] text-xs sm:text-sm font-medium">
            {t('slide_editors.pdf.page')} {currentPageIndex + 1} / {totalPages}
          </div>

          <button
            onClick={goToNextPage}
            disabled={currentPageIndex === totalPages - 1}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm ${
              currentPageIndex === totalPages - 1
                ? 'bg-[#3B3B3B] text-[#666666] cursor-not-allowed'
                : 'bg-[#4CAF50] hover:bg-[#43A047] text-white'
            }`}
          >
            <span className="hidden sm:inline">{t('slide_editors.pdf.next')}</span>
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// eslint-disable-next-line no-unused-vars
const SlideCanvas = ({ slide, presentation, isPresenter = false, onSettingsChange, onSaveSettings, responses = [], isLive = false }) => {
  const { t } = useTranslation();
  const { id: presentationId } = useParams();
  const [question, setQuestion] = useState(slide?.question || '');
  const [leaderboardSummary, setLeaderboardSummary] = useState(null);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState(null);
  // Ref for pin on image - must be at top level to follow Rules of Hooks
  const pinImageRef = useRef(null);

  // Extract video ID from YouTube URL
  const getYoutubeVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : '';
  };

  // Check if URL is a valid video URL (YouTube or Vimeo)
  const isValidVideoUrl = (url) => {
    return url && (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com'));
  };

  // Clean Cloudinary URL by removing transformation parameters that might cause 400 errors
  // This fixes broken eager transformation URLs
  const cleanCloudinaryUrl = (url) => {
    if (!url || !url.includes('cloudinary.com')) {
      return url;
    }
    
    // If URL contains transformation parameters (like /br_auto,f_auto,q_auto:eco/)
    // and it's a video URL, try to get the base URL
    // Pattern: https://res.cloudinary.com/cloud_name/video/upload/transformations/v1234567/folder/file.ext
    const cloudinaryVideoPattern = /(https:\/\/res\.cloudinary\.com\/[^\/]+\/video\/upload\/)([^\/]+\/)(v\d+\/.*)/;
    const match = url.match(cloudinaryVideoPattern);
    
    if (match) {
      // Reconstruct URL without transformation parameters
      // Format: https://res.cloudinary.com/cloud_name/video/upload/v1234567/folder/file.ext
      return `${match[1]}${match[3]}`;
    }
    
    // If pattern doesn't match, return original URL
    return url;
  };

  // Update local state when slide prop changes
  useEffect(() => {
    if (slide?.question !== undefined) {
      setQuestion(slide.question);
    }
  }, [slide?.id, slide?.question]); // Include question to update in real-time when edited

  // Fetch leaderboard data when viewing a leaderboard slide
  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (slide?.type === 'leaderboard' && presentationId) {
        setIsLoadingLeaderboard(true);
        setLeaderboardError(null);
        try {
          const response = await api.get(`/presentations/${presentationId}/leaderboard?limit=10`);
          setLeaderboardSummary(response.data || null);
        } catch (error) {
          console.error('Failed to fetch leaderboard:', error);
          setLeaderboardSummary(null);
          setLeaderboardError('Unable to fetch leaderboard data');
        } finally {
          setIsLoadingLeaderboard(false);
        }
      }
    };

    fetchLeaderboard();
  }, [slide?.type, presentationId]);

  const linkedQuizSlideId = slide?.leaderboardSettings?.linkedQuizSlideId?.toString?.() ?? null;

  const leaderboardContext = useMemo(() => {
    if (!leaderboardSummary) {
      return null;
    }

    const perQuizLeaderboards = Array.isArray(leaderboardSummary.perQuizLeaderboards)
      ? leaderboardSummary.perQuizLeaderboards
      : [];
    const lastPerQuizEntry = perQuizLeaderboards.length > 0
      ? perQuizLeaderboards[perQuizLeaderboards.length - 1]
      : null;

    if (!linkedQuizSlideId) {
      return {
        title: 'Final Leaderboard',
        subtitle: 'Overall standings for this presentation',
        leaderboard: leaderboardSummary.finalLeaderboard || [],
        isFinalLeaderboard: true,
      };
    }

    const perQuizEntry = perQuizLeaderboards.find(
      (entry) => entry.quizSlideId === linkedQuizSlideId
    );

    if (!perQuizEntry) {
      return null;
    }

    // For quiz-linked leaderboards, use the quiz question/title
    const quizQuestion = perQuizEntry.question || 'Quiz';
    const leaderboardTitle = `${quizQuestion} leaderboard results`;

    const leaderboardList = perQuizEntry.leaderboard || [];

    return {
      title: leaderboardTitle,
      subtitle: `Results for: ${quizQuestion}`,
      leaderboard: leaderboardList,
      isFinalLeaderboard: false,
    };
  }, [leaderboardSummary, linkedQuizSlideId]);

  const renderLeaderboardList = (list, { valueLabel, getValue }) => {
    if (!list || list.length === 0) {
      return (
        <div className="rounded-xl border border-dashed border-[#3A3A3A] bg-[#181818] py-12 text-center text-sm text-[#9E9E9E]">
          Leaderboard will display here after quiz is completed
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {list.map((participant, index) => {
          const displayName = participant.participantName || 'Anonymous';
          const value = getValue(participant);

          return (
            <div
              key={participant.participantId || `${displayName}-${index}`}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 ${
                index === 0 ? 'bg-[#2A2520] border-[#FFD700]/30' :
                index === 1 ? 'bg-[#252525] border-[#C0C0C0]/30' :
                index === 2 ? 'bg-[#252020] border-[#CD7F32]/30' :
                'bg-[#1F1F1F] border-[#2A2A2A]'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                index === 0 ? 'bg-[#FFD700] text-[#1F1F1F]' :
                index === 1 ? 'bg-[#C0C0C0] text-[#1F1F1F]' :
                index === 2 ? 'bg-[#CD7F32] text-[#1F1F1F]' :
                'bg-[#2A2A2A] text-[#E0E0E0]'
              }`}>
                {index + 1}
              </div>

              <div className="flex-1">
                <div className="text-lg font-bold text-[#E0E0E0]">
                  {displayName}
                </div>
                <div className="text-xs text-[#9E9E9E]">
                  Total Quizzes: {participant.quizCount ?? '—'}
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold text-[#4CAF50]">
                  {value}
                </div>
                <div className="text-xs text-[#9E9E9E]">{valueLabel}</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render based on slide type
  const renderSlideContent = () => {
    switch (slide?.type) {
      case 'multiple_choice':
        return (
          <div className="w-full max-w-3xl mx-auto">
            <div className="rounded-3xl border border-[#2F2F2F] bg-[#1F1F1F] shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
              <div className="border-b border-[#2A2A2A] px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8 lg:pt-10 pb-4 sm:pb-6">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-[#E0E0E0] text-center">
                  {typeof slide?.question === 'string' 
                    ? slide.question 
                    : (slide?.question?.text || slide?.question?.label || t('slide_editors.mcq.question_placeholder'))}
                </h2>
              </div>

              <div className="px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-10 space-y-3 sm:space-y-4">
                {(!slide.options || slide.options.length === 0) ? (
                  <div className="rounded-xl border border-dashed border-[#3A3A3A] bg-[#232323] py-8 sm:py-12 text-center text-sm text-[#9E9E9E]">
                    {t('slide_editors.pick_answer.preview_prompt')}
                  </div>
                ) : (
                  slide.options.map((option, index) => {
                    const voteCount = 0;
                    const percentage = 0;
                    const optionText = typeof option === 'string' ? option : (option?.text || `Option ${index + 1}`);

                    return (
                      <div key={index} className="relative overflow-hidden rounded-2xl border border-[#2F2F2F] bg-[#262626]">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#2E7D32]/60 to-[#4CAF50]/40" style={{ width: `${percentage}%` }} />
                        <div className="relative flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
                          <div className="text-left">
                            <p className="text-sm sm:text-base lg:text-lg font-semibold text-[#E0E0E0]">{optionText}</p>
                            <p className="text-xs text-[#9E9E9E]">{t('slide_editors.pick_answer.responses_appear_here')}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg sm:text-xl font-bold text-[#4CAF50]">{voteCount}</span>
                            <span className="text-xs sm:text-sm text-[#9E9E9E]">{t('slide_editors.mcq.votes')}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="border-t border-[#2A2A2A] px-4 sm:px-6 lg:px-10 py-4 sm:py-6 text-center text-xs sm:text-sm text-[#8A8A8A]">
                {t('slide_editors.pick_answer.speaker_note')}
              </div>
            </div>
          </div>
        );

      case 'quiz': {
        const quizOptions = Array.isArray(slide?.quizSettings?.options)
          ? slide.quizSettings.options
          : [];
        const correctOptionId = slide?.quizSettings?.correctOptionId;

        return (
          <div className="w-full max-w-3xl mx-auto">
            <div className="rounded-2xl sm:rounded-3xl border border-[#2F2F2F] bg-[#111111] shadow-[0_12px_40px_rgba(0,0,0,0.55)]">
              <div className="border-b border-[#2A2A2A] px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8 lg:pt-10 pb-4 sm:pb-6">
                <div className="flex items-center justify-between text-xs text-[#7E7E7E] mb-3">
                  <span className="uppercase tracking-[0.3em]">{t('slide_editors.quiz.quiz_label')}</span>
                  <span className="text-[10px] sm:text-xs">{t('slide_editors.quiz.time_limit_label')}: {slide?.quizSettings?.timeLimit ?? 30}s</span>
                </div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-[#E0E0E0] text-center">
                  {slide?.question || t('slide_editors.quiz.default_title')}
                </h2>
              </div>

              <div className="px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-10 space-y-3 sm:space-y-4">
                {quizOptions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#3A3A3A] bg-[#181818] py-8 sm:py-12 text-center text-xs sm:text-sm text-[#9E9E9E] px-4">
                    {t('slide_editors.quiz.preview_prompt')}
                  </div>
                ) : (
                  quizOptions.map((option, index) => {
                    const isCorrect = option.id === correctOptionId;

                    return (
                      <div
                        key={option.id || index}
                        className={`relative overflow-hidden rounded-xl sm:rounded-2xl border ${
                          isCorrect
                            ? 'border-[#2E7D32] bg-[#1D2A20]'
                            : 'border-[#2F2F2F] bg-[#181818]'
                        }`}
                      >
                        {isCorrect && (
                          <div className="absolute inset-y-0 left-0 w-1 bg-[#4CAF50]" />
                        )}
                        <div className="relative flex items-center justify-between px-3 sm:px-4 lg:px-6 py-3 sm:py-4 gap-2 sm:gap-4">
                          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                            <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-[#2F2F2F] text-xs sm:text-sm font-semibold text-[#E0E0E0] flex-shrink-0">
                              {index + 1}
                            </span>
                            <p className="text-sm sm:text-base lg:text-lg font-medium text-[#E0E0E0] truncate">
                              {typeof option === 'string' 
                                ? option 
                                : (typeof option.text === 'string' ? option.text : `Option ${index + 1}`)}
                            </p>
                          </div>
                          {isCorrect && (
                            <span className="text-xs sm:text-sm font-semibold text-[#4CAF50] flex-shrink-0 hidden sm:inline">
                              {t('slide_editors.quiz.correct_answer_label')}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="border-t border-[#2A2A2A] px-4 sm:px-6 lg:px-10 py-4 sm:py-6 text-center text-[10px] sm:text-xs text-[#7E7E7E]">
                {t('slide_editors.quiz.points_message')}
              </div>
            </div>
          </div>
        );
      }

      case 'word_cloud':
        return (
          <div className="w-full max-w-3xl mx-auto">
            <div className="rounded-2xl sm:rounded-3xl border border-[#2F2F2F] bg-[#1F1F1F] shadow-[0_12px_40px_rgba(0,0,0,0.45)] px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-12 text-center">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-[#E0E0E0] mb-6 sm:mb-8 lg:mb-10">
                {question || t('slide_editors.word_cloud.default_title')}
              </h2>
              <div className="h-32 sm:h-48 lg:h-56 flex items-center justify-center rounded-xl sm:rounded-2xl border border-dashed border-[#3A3A3A] bg-[#252525]">
                <p className="text-xs sm:text-sm text-[#9E9E9E] px-4">{t('slide_editors.word_cloud.preview_message')}</p>
              </div>
            </div>
          </div>
        );

      case 'open_ended':
        return (
          <div className="w-full max-w-3xl mx-auto">
            <div className="rounded-2xl sm:rounded-3xl border border-[#2F2F2F] bg-[#1F1F1F] shadow-[0_12px_40px_rgba(0,0,0,0.45)] px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-12 text-center">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-[#E0E0E0] mb-6 sm:mb-8 lg:mb-10">
                {question || t('slide_editors.open_ended.default_title')}
              </h2>
              <div className="h-32 sm:h-48 lg:h-56 flex flex-col items-center justify-center gap-2 rounded-xl sm:rounded-2xl border border-dashed border-[#3A3A3A] bg-[#252525] px-4">
                <p className="text-xs sm:text-sm text-[#9E9E9E]">{t('slide_editors.open_ended.preview_message')}</p>
                <p className="text-xs text-[#7E7E7E]">{t('slide_editors.open_ended.preview_encourage')}</p>
              </div>
            </div>
          </div>
        );

      case 'scales':
        {
          const statements = Array.isArray(slide?.statements)
? slide.statements.filter(Boolean)
            : [];

          return (
            <div className="w-full max-w-3xl mx-auto">
              <div className="rounded-2xl sm:rounded-3xl border border-[#2F2F2F] bg-[#1F1F1F] shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
                <div className="border-b border-[#2A2A2A] px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8 lg:pt-10 pb-4 sm:pb-6">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-[#E0E0E0] text-center">
                    {question || t('slide_editors.scales.default_title')}
                  </h2>
                </div>

                <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-12">
                  {statements.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#3A3A3A] bg-[#252525] py-8 sm:py-12 text-center text-sm text-[#9E9E9E]">
                      {t('slide_editors.scales.preview_prompt')}
                    </div>
                  ) : (
                    statements.map((statement, index) => {
                      const statementText = typeof statement === 'string' ? statement : (statement?.text || t('slide_editors.scales.statement_with_number', { number: index + 1 }));
                      return (
                      <div key={index} className="space-y-2 sm:space-y-3">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <span className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-[#388E3C] text-xs font-semibold text-white flex-shrink-0">
                            {index + 1}
                          </span>
                          <p className="text-sm sm:text-base lg:text-lg font-medium text-[#E0E0E0] break-words">{statementText}</p>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4 text-xs text-[#9E9E9E]">
                          <span className="flex-shrink-0">{slide?.minLabel || `${slide?.minValue ?? 1}`}</span>
                          <div className="h-2 flex-1 rounded-full bg-[#303030]" />
                          <span className="flex-shrink-0">{slide?.maxLabel || `${slide?.maxValue ?? 5}`}</span>
                        </div>
                      </div>
                      );
                    })
                  )}
                </div>

                <div className="border-t border-[#2A2A2A] px-4 sm:px-6 lg:px-10 py-4 sm:py-6 text-center text-xs sm:text-sm text-[#8A8A8A]">
                  {t('slide_editors.scales.scale_range_label')}: {slide?.minValue ?? 1} – {slide?.maxValue ?? 5}
                </div>
              </div>
            </div>
          );
        }

      case 'ranking':
        {
          const rankingItems = Array.isArray(slide?.rankingItems)
            ? slide.rankingItems.filter(item => item && item.label)
            : [];

          return (
            <div className="w-full max-w-3xl mx-auto">
              <div className="rounded-3xl border border-[#2F2F2F] bg-[#1F1F1F] shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
                <div className="border-b border-[#2A2A2A] px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8 lg:pt-10 pb-4 sm:pb-6">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-[#E0E0E0] text-center">
                    {question || t('slide_editors.ranking.default_title')}
                  </h2>
                </div>

                <div className="px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-10 space-y-3 sm:space-y-4">
                  {rankingItems.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#3A3A3A] bg-[#252525] py-8 sm:py-12 text-center text-sm text-[#9E9E9E]">
                      {t('slide_editors.ranking.preview_prompt')}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {rankingItems.map((item, index) => {
                        const itemLabel = typeof item === 'string' ? item : (item?.label || `Item ${index + 1}`);
                        return (
                        <div key={item.id || index} className="flex items-center gap-4 rounded-2xl border border-[#2F2F2F] bg-[#262626] px-4 sm:px-6 py-3 sm:py-4">
                          <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-[#388E3C] text-base sm:text-lg font-semibold text-white">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-base sm:text-lg font-medium text-[#E0E0E0]">{itemLabel}</p>
                            <p className="text-xs text-[#7E7E7E]">{t('slide_editors.ranking.drag_handles_message')}</p>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="border-t border-[#2A2A2A] px-4 sm:px-6 lg:px-10 py-4 sm:py-6 text-center text-xs sm:text-sm text-[#8A8A8A]">
                  {t('slide_editors.ranking.instruction')}
                </div>
              </div>
            </div>
          );
        }

      case 'hundred_points':
        {
          const hundredPointsItems = Array.isArray(slide?.hundredPointsItems)
            ? slide.hundredPointsItems.filter(item => item && item.label)
            : [];

          return (
            <div className="w-full max-w-3xl mx-auto">
              <div className="rounded-3xl border border-[#2F2F2F] bg-[#1F1F1F] shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
                <div className="border-b border-[#2A2A2A] px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8 lg:pt-10 pb-4 sm:pb-6">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-[#E0E0E0] text-center">
                    {question || t('slide_editors.hundred_points.default_title')}
                  </h2>
                </div>

                <div className="px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-10 space-y-3 sm:space-y-4">
                  {hundredPointsItems.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#3A3A3A] bg-[#252525] py-8 sm:py-12 text-center text-sm text-[#9E9E9E]">
                      {t('slide_editors.hundred_points.preview_prompt')}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {hundredPointsItems.map((item, index) => {
                        const itemLabel = typeof item === 'string' ? item : (item?.label || t('slide_editors.hundred_points.item_with_number', { number: index + 1 }));
                        return (
                        <div key={item.id || index} className="flex items-center gap-4 rounded-2xl border border-[#2F2F2F] bg-[#262626] px-4 sm:px-6 py-3 sm:py-4">
                          <div className="flex-1">
                            <p className="text-base sm:text-lg font-medium text-[#E0E0E0]">{itemLabel}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-12 sm:h-10 sm:w-16 items-center justify-center rounded-lg bg-[#2E7D32]/20 text-base sm:text-lg font-semibold text-[#4CAF50]">
                              0
                            </div>
                            <span className="text-xs sm:text-sm text-[#9E9E9E]">{t('slide_editors.hundred_points.pts')}</span>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="border-t border-[#2A2A2A] px-4 sm:px-6 lg:px-10 py-4 sm:py-6 text-center text-xs sm:text-sm text-[#8A8A8A]">
                  {t('slide_editors.hundred_points.instruction')}
                </div>
              </div>
            </div>
          );
        }

      case '2x2_grid':
        {
          const gridItems = Array.isArray(slide?.gridItems) 
            ? slide.gridItems.filter(item => item && (item.label || typeof item === 'string')) 
            : [];

          const axisXLabel = slide?.gridAxisXLabel || t('slide_editors.two_by_two_grid.horizontal_axis_default');
          const axisYLabel = slide?.gridAxisYLabel || t('slide_editors.two_by_two_grid.vertical_axis_default');

          return (
            <div className="w-full max-w-4xl mx-auto">
              <div className="rounded-3xl border border-[#2F2F2F] bg-[#1F1F1F] shadow-[0_12px_40px_rgba(0,0,0,0.45)] p-4 sm:p-6 lg:p-8">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-[#E0E0E0] text-center mb-4 sm:mb-6">
                  {question || t('slide_editors.two_by_two_grid.default_title')}
                </h2>
                
                <div className="flex gap-4 sm:gap-6 items-start">
                  {/* Left: Grid with Y-axis label */}
                  <div className="flex-1 max-w-sm">
                    <div className="flex items-start gap-2">
                      {/* Y-axis label */}
                      <div className="flex items-center justify-center w-5 sm:w-6 pt-12 sm:pt-16">
                        <div className="transform -rotate-90 whitespace-nowrap text-xs font-semibold text-[#9E9E9E]">
                          {axisYLabel}
                        </div>
                      </div>

                      {/* Grid */}
                      <div className="flex-1">
                        <div className="w-full aspect-square rounded-xl border-2 border-[#2F2F2F] relative overflow-hidden shadow-inner">
                          {/* Grid lines */}
                          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                            <div className="border-r border-b border-2 border-[#2F2F2F]"></div>
                            <div className="border-b border-2 border-[#2F2F2F]"></div>
                            <div className="border-r border-2 border-[#2F2F2F]"></div>
                            <div className="border-r border-2 border-[#2F2F2F]"></div>
                          </div>
                          
                          {/* Animated sample dots */}
                          {gridItems.length > 0 && (
                            <>
                              {gridItems.map((item, index) => {
                                const accentPalette = ['#FF8A65', '#4FC3F7', '#BA68C8', '#FFD54F', '#7986CB', '#CE93D8'];
                                const positions = [
                                  { x: 20, y: 75 },
                                  { x: 40, y: 85 },
                                  { x: 65, y: 70 },
                                  { x: 30, y: 50 },
                                  { x: 55, y: 45 },
                                  { x: 80, y: 60 },
                                  { x: 25, y: 25 },
                                  { x: 50, y: 30 },
                                  { x: 75, y: 25 },
                                  { x: 35, y: 10 },
                                  { x: 60, y: 15 },
                                  { x: 85, y: 40 }
                                ];
                                const pos = positions[index % positions.length];
                                const itemLabel = typeof item === 'string' ? item : (item?.label || `Item ${index + 1}`);

                                return (
                                  <div
                                    key={item.id || index}
                                    className="absolute w-2 sm:w-3 h-2 sm:h-3 rounded-full animate-pulse"
                                    style={{
                                      backgroundColor: accentPalette[index % accentPalette.length],
                                      left: `${pos.x}%`,
                                      bottom: `${pos.y}%`,
                                      transform: 'translate(-50%, 50%)',
                                      animation: `pulse 2s ease-in-out ${index * 0.2}s infinite`
                                    }}
                                    title={itemLabel}
                                  />
                                );
                              })}
                            </>
                          )}
                        </div>
                        
                        {/* X-axis label */}
                        <div className="text-center mt-2 text-xs font-semibold text-[#9E9E9E]">
                          {axisXLabel}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Items list */}
                  <div className="flex-1">
                    <h3 className="text-xs font-semibold text-[#B0B0B0] mb-2">{t('slide_editors.two_by_two_grid.items_label')}</h3>
                    <div className="space-y-2">
                      {gridItems.length === 0 ? (
                        <div className="text-center text-xs text-[#7E7E7E] py-3 sm:py-4 bg-[#232323] rounded-lg border border-dashed border-[#3A3A3A]">
                          {t('slide_editors.two_by_two_grid.preview_prompt')}
                        </div>
                      ) : (
                        gridItems.map((item, index) => {
                          const legendPalette = ['#FF8A65', '#4FC3F7', '#BA68C8', '#FFD54F', '#7986CB', '#CE93D8', '#4DB6AC', '#A1887F'];
                          const itemLabel = typeof item === 'string' ? item : (item?.label || `Item ${index + 1}`);

                          return (
                            <div key={item.id || index} className="flex items-center gap-2 text-xs text-[#E0E0E0] bg-[#232323] rounded-lg px-3 py-2 border border-[#2F2F2F]">
                              <div 
                                className="w-2 sm:w-3 h-2 sm:h-3 rounded-full flex-shrink-0" 
                                style={{ 
                                  backgroundColor: legendPalette[index % legendPalette.length]
                                }}
                              />
                              <span className="font-medium">{itemLabel}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        }

      case 'qna':
        return (
          <div className="w-full max-w-2xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-normal text-[#E0E0E0] mb-8 sm:mb-12">
              {question || t('slide_editors.qna.default_title')}
            </h2>
            <div className="h-32 sm:h-48 lg:h-64 flex items-center justify-center bg-[#232323] rounded-lg border border-dashed border-[#3A3A3A]">
              <p className="text-[#9E9E9E]">{t('slide_editors.qna.questions_appear_message')}</p>
            </div>
          </div>
        );

      case 'pin_on_image':
        {
          const imageUrl = slide?.pinOnImageSettings?.imageUrl;
          const correctArea = slide?.pinOnImageSettings?.correctArea;

          return (
            <div className="w-full max-w-4xl mx-auto">
              <div className="rounded-3xl border border-[#2F2F2F] bg-[#1F1F1F] shadow-[0_12px_40px_rgba(0,0,0,0.45)] p-4 sm:p-6 lg:p-8">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-[#E0E0E0] text-center mb-4 sm:mb-6">
                  {question || t('slide_editors.pin_on_image.default_title')}
                </h2>
                
                {imageUrl ? (
                  <div className="relative rounded-xl overflow-hidden border-2 border-[#2F2F2F] bg-[#232323]">
                    <img
                      ref={pinImageRef}
                      src={imageUrl}
                      alt={t('slide_editors.pin_on_image.image_alt')}
                      className="w-full h-auto object-contain"
                      style={{ maxHeight: '60vh' }}
                    />
                    {/* Correct area overlay - positioned relative to the actual image */}
                    {correctArea && <CorrectAreaOverlay correctArea={correctArea} imageRef={pinImageRef} />}
                    {/* Sample pin for preview */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full">
                      <svg className="w-5 sm:w-6 h-5 sm:h-6 text-[#4CAF50] drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-12 sm:py-16 text-[#9E9E9E] bg-[#232323] rounded-xl border-2 border-dashed border-[#3A3A3A]">
                    <p className="text-sm">{t('slide_editors.pin_on_image.upload_message')}</p>
                  </div>
                )}

                <p className="text-xs sm:text-sm text-[#9E9E9E] text-center mt-3 sm:mt-4">
                  {correctArea ? t('slide_editors.pin_on_image.correct_area_defined') : t('slide_editors.pin_on_image.single_pin_message')}
                </p>
              </div>
            </div>
          );
        }

      case 'leaderboard':
        return (
          <div className="w-full max-w-3xl mx-auto">
            <div className="rounded-3xl border border-[#2F2F2F] bg-[#111111] shadow-[0_12px_40px_rgba(0,0,0,0.55)]">
              <div className="border-b border-[#2A2A2A] px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8 lg:pt-10 pb-4 sm:pb-6">
                <div className="flex items-center justify-center gap-2 text-xs text-[#7E7E7E] mb-3">
                  <span className="uppercase tracking-[0.3em]">{t('presentation.leaderboard')}</span>
                </div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-[#E0E0E0] text-center">
                  {leaderboardContext?.title || t('presentation.leaderboard_default_title')}
                </h2>
                {leaderboardContext?.subtitle && (
                  <p className="mt-2 text-center text-sm text-[#9E9E9E]">
                    {leaderboardContext.subtitle}
                  </p>
                )}
              </div>

              <div className="px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-10">
                {isLoadingLeaderboard ? (
                  <div className="text-center py-8 sm:py-12 text-[#9E9E9E]">
                    {t('presentation.loading_leaderboard')}
                  </div>
                ) : (
                  <>
                    {leaderboardError && (
                      <div className="mb-4 rounded-xl border border-[#3A3A3A] bg-[#2A2A2A] px-4 py-3 text-sm text-[#FFA726]">
                        {leaderboardError}
                      </div>
                    )}
                    {renderLeaderboardList(
                      leaderboardContext?.leaderboard || [],
                      {
                        valueLabel: 'Total Score',
                        getValue: (participant) => participant.totalScore ?? participant.score ?? 0,
                      }
                    )}
                  </>
                )}
              </div>

              <div className="border-t border-[#2A2A2A] px-4 sm:px-6 lg:px-10 py-4 sm:py-6 text-center text-xs text-[#7E7E7E]">
                {t('presentation.leaderboard_footer')}
              </div>
            </div>
          </div>
        );

      case 'text':
        return (
          <div className="w-full max-w-3xl mx-auto px-2 sm:px-4">
            <div className="rounded-2xl sm:rounded-3xl border border-[#2F2F2F] bg-[#1F1F1F] shadow-[0_12px_40px_rgba(0,0,0,0.45)] p-4 sm:p-5 md:p-6 lg:p-8 xl:p-10">
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-[#E0E0E0] mb-3 sm:mb-4 md:mb-6 text-center px-2">
                {question || t('slide_editors.text.default_title')}
              </h2>
              <div className="prose prose-invert max-w-none text-[#E0E0E0] text-sm sm:text-base md:text-lg leading-relaxed whitespace-pre-wrap break-words">
                {slide?.textContent || t('slide_editors.text.default_content')}
              </div>
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="w-full max-w-4xl mx-auto px-2 sm:px-4">
            <div className="rounded-2xl sm:rounded-3xl border border-[#2F2F2F] bg-[#1F1F1F] shadow-[0_12px_40px_rgba(0,0,0,0.45)] p-3 sm:p-4 md:p-6 lg:p-8">
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-[#E0E0E0] mb-3 sm:mb-4 md:mb-6 text-center px-2">
                {question || t('slide_editors.image.default_title')}
              </h2>
              {slide?.imageUrl ? (
                <div className="rounded-lg sm:rounded-xl overflow-hidden border border-[#2F2F2F] bg-[#232323]">
                  <img 
                    src={slide.imageUrl} 
                    alt="Slide content" 
                    className="w-full h-auto object-contain max-h-[50vh] sm:max-h-[60vh] md:max-h-[70vh]"
                  />
                </div>
              ) : (
                <div className="rounded-lg sm:rounded-xl border-2 border-dashed border-[#3A3A3A] bg-[#232323] py-8 sm:py-12 md:py-16 text-center px-4">
                  <p className="text-sm sm:text-base text-[#9E9E9E]">{t('slide_editors.image.upload_prompt')}</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="w-full max-w-4xl mx-auto px-2 sm:px-4">
            <div className="rounded-2xl sm:rounded-3xl border border-[#2F2F2F] bg-[#1F1F1F] shadow-[0_12px_40px_rgba(0,0,0,0.45)] p-3 sm:p-4 md:p-6 lg:p-8">
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-[#E0E0E0] mb-3 sm:mb-4 md:mb-6 text-center px-2">
                {question || t('slide_editors.video.default_title')}
              </h2>
              {(slide?.videoUrl && slide.videoUrl.trim() !== '') ? (
                <div className="rounded-lg sm:rounded-xl overflow-hidden border border-[#2F2F2F] bg-[#232323] aspect-video w-full">
                  {isValidVideoUrl(slide.videoUrl) ? (
                    // YouTube/Vimeo URL - use iframe
                    <iframe
                      src={`https://www.youtube.com/embed/${getYoutubeVideoId(slide.videoUrl)}`}
                      title="Video content"
                      className="w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    // Uploaded video - use video tag
                    <video
                      src={cleanCloudinaryUrl(slide.videoUrl)}
                      controls
                      className="w-full h-full"
                      style={{ objectFit: 'contain' }}
                      onError={(e) => {
                        console.error('Video load error:', e.target.src);
                        // If video fails to load, try the original URL without transformations
                        if (e.target.src !== slide.videoUrl) {
                          e.target.src = slide.videoUrl;
                        }
                      }}
                    >
                      {t('slide_editors.video.video_not_supported')}
                    </video>
                  )}
                </div>
              ) : (
                <div className="rounded-lg sm:rounded-xl border-2 border-dashed border-[#3A3A3A] bg-[#232323] py-8 sm:py-12 md:py-16 text-center px-4">
                  <p className="text-sm sm:text-base text-[#9E9E9E]">{t('slide_editors.video.enter_url_prompt')}</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'instruction':
        return (
          <InstructionPresenterView 
            slide={slide} 
            presentation={presentation} 
          />
        );

      case 'pick_answer':
        return (
          <div className="w-full max-w-3xl mx-auto">
            <div className="rounded-3xl border border-[#2F2F2F] bg-[#1F1F1F] shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
              <div className="border-b border-[#2A2A2A] px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8 lg:pt-10 pb-4 sm:pb-6">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-[#E0E0E0] text-center">
                  {slide?.question || t('slide_editors.pick_answer.default_title')}
                </h2>
              </div>

              <div className="px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-10 space-y-3 sm:space-y-4">
                {(!slide.options || slide.options.length === 0) ? (
                  <div className="rounded-xl border border-dashed border-[#3A3A3A] bg-[#232323] py-8 sm:py-12 text-center text-sm text-[#9E9E9E]">
                    {t('slide_editors.pick_answer.preview_prompt')}
                  </div>
                ) : (
                  slide.options.map((option, index) => {
                    const voteCount = 0;
                    const percentage = 0;
                    const optionText = typeof option === 'string' ? option : (option?.text || `Option ${index + 1}`);

                    return (
                      <div key={index} className="relative overflow-hidden rounded-2xl border border-[#2F2F2F] bg-[#262626]">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#2E7D32]/60 to-[#4CAF50]/40" style={{ width: `${percentage}%` }} />
                        <div className="relative flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
                          <div className="text-left">
                            <p className="text-sm sm:text-base lg:text-lg font-semibold text-[#E0E0E0]">{optionText}</p>
                            <p className="text-xs text-[#9E9E9E]">{t('slide_editors.pick_answer.responses_appear_here')}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg sm:text-xl font-bold text-[#4CAF50]">{voteCount}</span>
                            <span className="text-xs sm:text-sm text-[#9E9E9E]">{t('slide_editors.pick_answer.votes')}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="border-t border-[#2A2A2A] px-4 sm:px-6 lg:px-10 py-4 sm:py-6 text-center text-xs sm:text-sm text-[#8A8A8A]">
                {t('slide_editors.pick_answer.speaker_note')}
              </div>
            </div>
          </div>
        );

      case 'type_answer':
        return (
          <div className="w-full max-w-3xl mx-auto">
            <div className="rounded-3xl border border-[#2F2F2F] bg-[#1F1F1F] shadow-[0_12px_40px_rgba(0,0,0,0.45)] p-4 sm:p-6 lg:p-10">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-[#E0E0E0] mb-4 sm:mb-6 text-center">
                {question || t('slide_editors.type_answer.default_title')}
              </h2>
              
              <div className="mt-6 sm:mt-8">
                <div className="rounded-xl border border-dashed border-[#3A3A3A] bg-[#232323] py-8 sm:py-12 text-center">
                  <p className="text-[#9E9E9E]">{t('slide_editors.type_answer.participant_prompt')}</p>
                  {slide?.openEndedSettings?.isVotingEnabled && (
                    <p className="text-[#4CAF50] mt-2 text-xs sm:text-sm">{t('slide_editors.type_answer.voting_enabled')}</p>
                  )}
                </div>
              </div>
              
              <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-[#8A8A8A]">
                {t('slide_editors.type_answer.real_time_responses')}
              </div>
            </div>
          </div>
        );

      case 'miro':
        return (
          <div className="w-full max-w-4xl mx-auto">
            <div className="rounded-3xl border border-[#2F2F2F] bg-[#1F1F1F] shadow-[0_12px_40px_rgba(0,0,0,0.45)] p-4 sm:p-6 lg:p-8">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-[#E0E0E0] mb-4 sm:mb-6 text-center">
                {question || t('slide_editors.miro.default_title')}
              </h2>
              
              <div className="aspect-video bg-[#232323] rounded-xl overflow-hidden border border-[#2F2F2F] flex items-center justify-center">
                <div className="text-center p-4 sm:p-6">
                  <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-purple-500 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">{t('slide_editors.miro.board_title')}</h3>
                  <p className="text-gray-400 mb-3 sm:mb-4 text-xs sm:text-sm">{t('slide_editors.miro.participant_interaction')}</p>
                  <div className="inline-flex items-center px-3 py-1 sm:px-4 sm:py-2 bg-purple-600 rounded-full">
                    <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-white rounded-full mr-1.5 sm:mr-2 animate-pulse"></span>
                    <span className="text-white text-xs sm:text-sm">{t('slide_editors.miro.live_collaboration')}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-[#8A8A8A]">
                {t('slide_editors.miro.redirect_message')}
              </div>
            </div>
          </div>
        );

      case 'powerpoint':
        return (
          <div className="w-full max-w-4xl mx-auto">
            <div className="rounded-3xl border border-[#2F2F2F] bg-[#1F1F1F] shadow-[0_12px_40px_rgba(0,0,0,0.45)] p-4 sm:p-6 lg:p-8">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-[#E0E0E0] mb-4 sm:mb-6 text-center">
                {question || t('slide_editors.powerpoint.default_title')}
              </h2>
              
              <div className="aspect-video bg-[#232323] rounded-xl overflow-hidden border border-[#2F2F2F] flex items-center justify-center">
                <div className="text-center p-4 sm:p-6">
                  <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-orange-500 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">{t('slide_editors.powerpoint.presentation_title')}</h3>
                  <p className="text-gray-400 mb-3 sm:mb-4 text-xs sm:text-sm">{t('slide_editors.powerpoint.participant_view')}</p>
                  <div className="inline-flex items-center px-3 py-1 sm:px-4 sm:py-2 bg-orange-600 rounded-full">
                    <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-white rounded-full mr-1.5 sm:mr-2 animate-pulse"></span>
                    <span className="text-white text-xs sm:text-sm">{t('slide_editors.powerpoint.live_presentation')}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-[#8A8A8A]">
                {t('slide_editors.powerpoint.redirect_message')}
              </div>
            </div>
          </div>
        );

      case 'pdf':
        return <PdfCanvasPreview slide={slide} question={question} t={t} />;

      case 'google_slides':
        return (
          <div className="w-full max-w-4xl mx-auto">
            <div className="rounded-3xl border border-[#2F2F2F] bg-[#1F1F1F] shadow-[0_12px_40px_rgba(0,0,0,0.45)] p-4 sm:p-6 lg:p-8">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-[#E0E0E0] mb-4 sm:mb-6 text-center">
                {question || t('slide_editors.google_slides.default_title')}
              </h2>
              
              <div className="aspect-video bg-[#232323] rounded-xl overflow-hidden border border-[#2F2F2F] flex items-center justify-center">
                <div className="text-center p-4 sm:p-6">
                  <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-blue-500 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">{t('slide_canvas.google_slides_presentation')}</h3>
                  <p className="text-gray-400 mb-3 sm:mb-4 text-xs sm:text-sm">{t('slide_canvas.participants_can_view')}</p>
                  <div className="inline-flex items-center px-3 py-1 sm:px-4 sm:py-2 bg-blue-600 rounded-full">
                    <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-white rounded-full mr-1.5 sm:mr-2 animate-pulse"></span>
                    <span className="text-white text-xs sm:text-sm">{t('slide_canvas.live_presentation')}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-[#8A8A8A]">
                {t('slide_canvas.redirect_google_slides')}
              </div>
            </div>
          </div>
        );

      default:
        // Handle unknown slide types with a generic display
        return (
          <div className="w-full max-w-3xl mx-auto">
            <div className="rounded-3xl border border-[#2F2F2F] bg-[#1F1F1F] shadow-[0_12px_40px_rgba(0,0,0,0.45)] p-8 sm:p-10 text-center">
              <h2 className="text-2xl sm:text-3xl font-semibold text-[#E0E0E0] mb-4">
                {question || t('slide_canvas.slide_content')}
              </h2>
              <p className="text-[#9E9E9E]">
                {t('slide_canvas.not_configured')}
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8 overflow-y-auto w-full">
        {renderSlideContent()}
    </div>
  );
};

export default SlideCanvas;