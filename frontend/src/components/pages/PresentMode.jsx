import { X, ChevronLeft, ChevronRight, Users, ArrowLeft, Ban, MessageSquare, UserPlus } from 'lucide-react';
import LiveChatDrawer from '../presentation/LiveChatDrawer';
import FloatingReactionsOverlay from '../presentation/FloatingReactionsOverlay';
import MCQPresenterResults from '../interactions/mcq/PresenterResults';
import WordCloudPresenterResults from '../interactions/wordCloud/PresenterResults';
import OpenEndedPresenter from '../interactions/openEnded/PresenterView';
import ScalesPresenterView from '../interactions/scales/PresenterView';
import RankingPresenterView from '../interactions/ranking/PresenterView';
import HundredPointsPresenterView from '../interactions/hundredPoints/PresenterView';
import PresenterQnaView from '../interactions/qna/PresenterView';
import PresenterGuessView from '../interactions/guessNumber/PresenterView';
import QuizPresenterResults from '../interactions/quiz/PresenterResults';
import LeaderboardPresenterResults from '../interactions/leaderboard/PresenterResults';
import PickAnswerPresenterView from '../interactions/pickAnswer/presenter/PresenterView';
import TypeAnswerPresenterView from '../interactions/typeAnswer/presenter/PresenterView';
import MiroPresenterView from '../interactions/miro/presenter/PresenterView';
import PowerPointPresenterView from '../interactions/powerpoint/presenter/PresenterView';
import GoogleSlidesPresenterView from '../interactions/googleSlides/presenter/PresenterView';
import PdfPresenterView from '../interactions/pdf/presenter/PresenterView';
import { emitOpenEndedSettingsUpdate } from '../interactions/openEnded/utils';
import TwoByTwoGridPresenterView from '../interactions/twoByTwoGrid/PresenterView';
import PinOnImagePresenterView from '../interactions/pinOnImage/PresenterView';
import InstructionPresenterView from '../interactions/instruction/presenter/PresenterView';
import SlideCanvas from '../presentation/SlideCanvas';
import { usePresentModeSocket } from '../../hooks/usePresentModeSocket';

const PresentMode = () => {
  const {
    activeTheme,
    cancelKickParticipant,
    confirmKickParticipant,
    currentPage,
    currentSlideIndex,
    getUserColorClass,
    getUserInitials,
    gridResults,
    guessDistribution,
    handleCancelEndPresentation,
    handleClearGuessResponses,
    handleClearQnaQuestions,
    handleConfirmEndPresentation,
    handleEndQuiz,
    handleKickParticipant,
    handleMarkQnaAnswered,
    handleNextSlide,
    handlePrevSlide,
    handleSetActiveQuestion,
    handleStartQuiz,
    hundredPointsResults,
    id,
    isCustomTheme,
    isLoading,
    leaderboard,
    mappedCurrentSlideIndex,
    navigateToSlidesList,
    openEndedResponses,
    openEndedSettings,
    orderedSlides,
    paginatedParticipants,
    participantCount,
    participantToKick,
    participants,
    pendingJoinRequests,
    pinResults,
    presentation,
    qnaQuestions,
    quizState,
    rankingResults,
    respondToJoinRequest,
    scaleAverage,
    scaleDistribution,
    scaleOverallAverage,
    scaleStatementAverages,
    scaleStatements,
    setCurrentPage,
    setOpenEndedSettings,
    setShowChatDrawer,
    setShowEndModal,
    setShowJoinRequests,
    setShowParticipantsDropdown,
    setUnreadChatCount,
    showChatDrawer,
    showEndModal,
    showJoinRequests,
    showKickConfirmation,
    showParticipantsDropdown,
    slides,
    socket,
    stageThemeStyle,
    statementCounts,
    t,
    totalPages,
    totalResponses,
    unreadChatCount,
    voteCounts,
    wordFrequencies
  } = usePresentModeSocket();

  const renderSlideContent = () => {
    // Use orderedSlides to include virtual final leaderboard
    // First try to get slide from orderedSlides using mapped index
    let slide = orderedSlides[mappedCurrentSlideIndex];
    
    // If not found and currentSlideIndex is slides.length (virtual slide marker), 
    // try to get the last slide from orderedSlides
    if (!slide && currentSlideIndex === slides.length && orderedSlides.length > 0) {
      const lastSlide = orderedSlides[orderedSlides.length - 1];
      if (lastSlide && (lastSlide.id === 'virtual-final-leaderboard' || lastSlide._id === 'virtual-final-leaderboard')) {
        slide = lastSlide;
      }
    }
    
    // Fallback to original slides array
    if (!slide) {
      slide = slides[currentSlideIndex];
    }
    
    if (!slide) return null;

    switch (slide.type) {
      case 'multiple_choice':
        return (
          <div className="w-full max-w-4xl mx-auto">
            <div className="mb-4 sm:mb-6">
              <h2 className="text-2xl sm:text-3xl font-semibold text-ink text-center leading-tight">
                {typeof slide.question === 'string' 
                  ? slide.question 
                  : (slide.question?.text || slide.question?.label || 'Ask your question here...')}
              </h2>
            </div>
            <MCQPresenterResults
              options={slide.options}
              voteCounts={voteCounts}
              totalResponses={totalResponses}
            />
            <div className="mt-4 sm:mt-6 text-center">
              <p className="text-sm sm:text-base text-ink-muted">
                Total Responses: <span className="font-bold text-accent-green">{totalResponses}</span>
              </p>
            </div>
          </div>
        );
      case 'scales':
        return (
          <ScalesPresenterView
            slide={slide}
            scaleDistribution={scaleDistribution}
            scaleAverage={scaleAverage}
            scaleStatementAverages={scaleStatementAverages}
            scaleStatements={scaleStatements}
            statementCounts={statementCounts}
            scaleOverallAverage={scaleOverallAverage}
            totalResponses={totalResponses}
          />
        );
      case 'word_cloud':
        return (
          <div className="w-full max-w-4xl mx-auto">
            <div className="mb-4 sm:mb-6">
              <h2 className="text-2xl sm:text-3xl font-semibold text-ink text-center leading-tight">
                {slide.question || 'Enter your prompt for the word cloud'}
              </h2>
            </div>
            <div className="mt-4 sm:mt-6">
              <WordCloudPresenterResults wordFrequencies={wordFrequencies} maxWords={80} width={700} height={400} />
            </div>
            <div className="mt-4 sm:mt-6 text-center">
              <p className="text-sm sm:text-base text-ink-muted">
                Total Submissions: <span className="font-bold text-accent-green">{totalResponses}</span>
              </p>
              {typeof slide.maxWordsPerParticipant === 'number' && (
                <p className="text-xs sm:text-sm text-ink-faint mt-1">Max words per participant: {slide.maxWordsPerParticipant}</p>
              )}
            </div>
          </div>
        );
      case 'open_ended':
        return (
          <OpenEndedPresenter
            slide={slide}
            responses={openEndedResponses}
            settings={openEndedSettings}
            onToggleVoting={(nextValue) => {
              const nextSettings = {
                ...openEndedSettings,
                isVotingEnabled: Boolean(nextValue),
              };
              setOpenEndedSettings(nextSettings);
              emitOpenEndedSettingsUpdate({
                socket,
                presentationId: id,
                slideId: slide.id,
                settings: nextSettings,
              });
            }}
          />
        );
      case 'ranking':
        return (
          <RankingPresenterView
            slide={slide}
            rankingResults={rankingResults || []}
            totalResponses={totalResponses}
          />
        );
      case 'qna':
        return (
          <PresenterQnaView
            slide={slide}
            questions={qnaQuestions}
            totalResponses={qnaQuestions.length}
            onMarkAnswered={handleMarkQnaAnswered}
            onClearAll={handleClearQnaQuestions}
            onSetActiveQuestion={handleSetActiveQuestion}
          />
        );
      case 'guess_number':
        return (
          <PresenterGuessView
            slide={slide}
            distribution={guessDistribution}
            correctAnswer={slide?.guessNumberSettings?.correctAnswer}
            onClearResponses={handleClearGuessResponses}
          />
        );
      case 'hundred_points':
        return (
          <HundredPointsPresenterView
            slide={slide}
            hundredPointsResults={hundredPointsResults || []}
            totalResponses={totalResponses}
          />
        );
      case '2x2_grid':
        return (
          <TwoByTwoGridPresenterView
            slide={slide}
            gridResults={gridResults}
            totalResponses={totalResponses}
          />
        );
      case 'pin_on_image':
        return (
          <PinOnImagePresenterView
            slide={slide}
            pinResults={pinResults}
            totalResponses={totalResponses}
          />
        );
      case 'quiz':
        return (
          <QuizPresenterResults
            slide={slide}
            quizState={quizState}
            leaderboard={leaderboard}
            onStartQuiz={handleStartQuiz}
            onEndQuiz={handleEndQuiz}
          />
        );
      case 'leaderboard':
        return (
          <LeaderboardPresenterResults
            slide={slide}
            leaderboard={leaderboard}
            slides={slides}
          />
        );
      case 'pick_answer':
        return (
          <PickAnswerPresenterView
            slide={slide}
            voteCounts={voteCounts}
            totalResponses={totalResponses}
            sendSocketMessage={(message) => socket.emit('presentation-message', message)}
          />
        );
      case 'type_answer':
        return (
          <TypeAnswerPresenterView
            slide={slide}
            responses={openEndedResponses}
            settings={openEndedSettings}
            onToggleVoting={(nextValue) => {
              const nextSettings = {
                ...openEndedSettings,
                isVotingEnabled: Boolean(nextValue),
              };
              setOpenEndedSettings(nextSettings);
              emitOpenEndedSettingsUpdate({
                socket,
                presentationId: id,
                slideId: slide.id,
                settings: nextSettings,
              });
            }}
          />
        );
      case 'miro':
        return (
          <MiroPresenterView
            slide={slide}
            responses={openEndedResponses}
          />
        );
      case 'powerpoint':
        return (
          <PowerPointPresenterView
            slide={slide}
            responses={openEndedResponses}
          />
        );
      case 'google_slides':
        return (
          <GoogleSlidesPresenterView
            slide={slide}
            responses={openEndedResponses}
          />
        );
      case 'pdf':
        // Debug: Log slide data for PDF
        console.log('PresentMode - PDF slide:', slide);
        console.log('PresentMode - PDF slide pdfPages:', slide?.pdfPages);
        
        // Safety check: Ensure PDF fields exist, fallback to empty if missing
        const pdfSlide = {
          ...slide,
          pdfUrl: slide.pdfUrl || '',
          pdfPublicId: slide.pdfPublicId || null,
          pdfPages: Array.isArray(slide.pdfPages) && slide.pdfPages.length > 0 
            ? slide.pdfPages 
            : []
        };
        
        return (
          <PdfPresenterView
            slide={pdfSlide}
            responses={openEndedResponses}
          />
        );
      case 'instruction':
        return (
          <InstructionPresenterView
            slide={slide}
            presentation={presentation}
          />
        );
      case 'video':
        return (
          <SlideCanvas
            slide={slide}
            presentation={presentation}
            isPresenter={true}
          />
        );
      case 'text':
        return (
          <SlideCanvas
            slide={slide}
            presentation={presentation}
            isPresenter={true}
          />
        );
      case 'image':
        return (
          <SlideCanvas
            slide={slide}
            presentation={presentation}
            isPresenter={true}
          />
        );
      default:
        return (
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#E0E0E0]">
              {typeof slide.question === 'string' 
                ? slide.question 
                : (slide.question?.text || slide.question?.label || '')}
            </h2>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary">
        <div className="text-2xl text-on-primary">Loading presentation...</div>
      </div>
    );
  }

  return (
    <div
      className={`h-screen flex flex-col overflow-hidden ${isCustomTheme ? '' : 'bg-canvas text-ink'}`}
      style={stageThemeStyle}
    >
      <header className="flex-shrink-0 border-b shadow-[var(--shadow-level-2)] z-10 bg-surface border-hairline">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-center gap-3 sm:gap-4 flex-1 min-w-0">
            <button
              className='flex gap-1.5 justify-center items-center px-3 py-1.5 rounded-md bg-surface text-ink border border-hairline hover:bg-canvas-soft hover:cursor-pointer transition-all active:scale-95'
              onClick={navigateToSlidesList}
            >
              <ArrowLeft className='w-4 h-4'/>
              <span className="text-sm font-medium">Back</span>
            </button>
            <h1 className="text-base sm:text-xl font-semibold truncate text-ink">{presentation?.title}</h1>
            <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-md border font-mono text-xs sm:text-sm font-semibold bg-canvas-soft border-hairline text-ink">
              {presentation?.accessCode}
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* User Icons Container */}
            <div id="user-icons-container" className="relative flex items-center">
              {/* User Icons - made clickable */}
              <div 
                className="flex -space-x-2 cursor-pointer"
                onClick={() => participants.length > 0 && setShowParticipantsDropdown(!showParticipantsDropdown)}
              >
                {participants.slice(0, 3).map((participant, index) => (
                  <div
                    key={index}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-on-primary text-xs font-bold ${getUserColorClass(index)} border-2 border-surface relative group`}
                    title={participant}
                  >
                    {getUserInitials(participant)}
                    {/* Tooltip for user icons */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full -mb-1 hidden group-hover:block bg-ink text-on-primary text-xs px-2 py-1 rounded-sm shadow-[var(--shadow-level-2)] z-50 whitespace-nowrap max-w-xs border border-white/10">
                      <div className="relative">
                        {participant}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-ink mt-1"></div>
                      </div>
                    </div>
                  </div>
                ))}
                {participants.length > 3 && (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-on-primary text-xs font-bold bg-ink-muted border-2 border-surface" title={`${participants.length - 3} more participants`}>
                    +{participants.length - 3}
                  </div>
                )}
              </div>
              
              {/* Participants Dropdown */}
              {showParticipantsDropdown && (
                <div id="participants-dropdown" className="absolute top-full right-0 mt-2 w-80 sm:w-[400px] bg-surface border border-hairline rounded-xl shadow-[var(--shadow-level-2)] z-50 overflow-hidden">
                  <div className="p-4 border-b border-hairline">
                    <h3 className="text-lg font-semibold text-ink">Participants ({participants.length})</h3>
                  </div>

                  <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {paginatedParticipants.map((participant, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg group">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-on-primary text-sm font-bold ${getUserColorClass(index)}`}>
                          {getUserInitials(participant)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-ink block whitespace-normal break-words">{participant}</span>
                        </div>
                        <button
                          onClick={() => handleKickParticipant(participant)}
                          className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                          title={t('presentation.remove_participant_tooltip')}
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between p-3 border-t border-hairline bg-canvas-soft">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 rounded-md bg-surface text-ink border border-hairline hover:bg-canvas-soft disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        Previous
                      </button>

                      <span className="text-ink-muted text-sm">
                        Page {currentPage} of {totalPages}
                      </span>

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 rounded-md bg-surface text-ink border border-hairline hover:bg-canvas-soft disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        Next
                      </button>
                    </div>
                  )}

                  {/* Close button */}
                  <button
                    onClick={() => setShowParticipantsDropdown(false)}
                    className="absolute top-2 right-2 p-1 rounded-full hover:bg-canvas-soft text-ink-muted hover:text-ink"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Original participant count */}
            <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md bg-white/10 border border-white/15 text-accent-green">
              <Users className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="font-semibold text-sm sm:text-base">{participantCount}</span>
            </div>

            {/* Join Requests (waiting room) */}
            {(presentation?.requireApproval || pendingJoinRequests.length > 0) && (
              <div className="relative" id="join-requests-dropdown">
                <button
                  onClick={() => setShowJoinRequests((prev) => !prev)}
                  className={`relative px-3 sm:px-4 py-1.5 sm:py-2 rounded-md border transition-all active:scale-95 flex items-center gap-2 cursor-pointer ${
                    pendingJoinRequests.length > 0
                      ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
                      : 'bg-white/10 border-white/15 text-white hover:bg-white/20'
                  }`}
                  title={t('presentation.join_requests_title')}
                >
                  <UserPlus className="h-4 w-4 sm:h-5 sm:w-5" />
                  {pendingJoinRequests.length > 0 && (
                    <span className="text-sm font-semibold">{pendingJoinRequests.length}</span>
                  )}
                </button>

                {showJoinRequests && (
                  <div className="absolute right-0 mt-2 w-72 max-h-80 overflow-y-auto bg-surface border border-hairline rounded-lg shadow-[var(--shadow-level-2)] z-50">
                    <div className="p-3 border-b border-hairline flex items-center justify-between">
                      <span className="text-sm font-semibold text-ink">{t('presentation.join_requests_title')}</span>
                      <button
                        onClick={() => setShowJoinRequests(false)}
                        className="p-1 rounded-full hover:bg-canvas-soft text-ink-muted hover:text-ink"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {pendingJoinRequests.length === 0 ? (
                      <div className="p-4 text-sm text-ink-faint text-center">
                        {t('presentation.join_requests_empty')}
                      </div>
                    ) : (
                      <div className="divide-y divide-hairline">
                        {pendingJoinRequests.map((req) => (
                          <div key={req.participantId} className="flex items-center justify-between gap-2 p-3">
                            <span className="text-sm text-ink truncate">{req.participantName}</span>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button
                                onClick={() => respondToJoinRequest(req.participantId, true)}
                                className="px-2.5 py-1 rounded-md bg-primary hover:bg-primary-active text-on-primary text-xs font-medium transition-colors"
                              >
                                {t('presentation.join_request_accept')}
                              </button>
                              <button
                                onClick={() => respondToJoinRequest(req.participantId, false)}
                                className="px-2.5 py-1 rounded-md bg-canvas-soft hover:bg-red-50 hover:text-red-600 text-ink-muted text-xs font-medium border border-hairline transition-colors"
                              >
                                {t('presentation.join_request_deny')}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Live Chat Button */}
            <button
              onClick={() => {
                setShowChatDrawer(!showChatDrawer);
                setUnreadChatCount(0);
              }}
              className="relative px-3 sm:px-4 py-1.5 sm:py-2 rounded-md bg-white/10 border border-white/15 hover:bg-white/20 text-white transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
              title="Live Chat"
            >
              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm font-medium hidden sm:inline">Chat</span>
              {unreadChatCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900 animate-bounce">
                  {unreadChatCount > 9 ? '9+' : unreadChatCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setShowEndModal(true)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-primary hover:bg-primary-active text-on-primary rounded-md flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[var(--shadow-level-1)]"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base font-medium">End</span>
            </button>
          </div>
        </div>
      </header>

      <main
        className={`flex-1 overflow-y-auto custom-scrollbar min-h-0 ${isCustomTheme ? '' : 'bg-canvas'}`}
        style={isCustomTheme ? { backgroundColor: activeTheme.colors.canvas } : undefined}
      >
        <div className="mx-auto w-full max-w-6xl min-h-full px-4 sm:px-6 py-6 sm:py-10 flex flex-col">
          <div className="w-full my-auto">
            {renderSlideContent()}
          </div>
        </div>
      </main>

      <footer className="flex-shrink-0 border-t shadow-[var(--shadow-level-2)] z-10 bg-surface border-hairline">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          <button
            onClick={handlePrevSlide}
            disabled={currentSlideIndex === 0}
            className="px-4 sm:px-6 py-2 sm:py-3 rounded-md bg-surface text-ink border border-hairline hover:bg-canvas-soft disabled:opacity-40 disabled:pointer-events-none flex items-center gap-2 transition-all active:scale-95 disabled:active:scale-100"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm sm:text-base font-medium">Previous</span>
          </button>

          <div className="text-base sm:text-lg font-semibold px-4 text-ink">
            <span className="text-accent-green">{mappedCurrentSlideIndex + 1}</span>
            <span className="text-ink-faint"> / </span>
            <span>{orderedSlides.length}</span>
          </div>

          <button
            onClick={handleNextSlide}
            disabled={mappedCurrentSlideIndex >= orderedSlides.length - 1}
            className="px-4 sm:px-6 py-2 sm:py-3 rounded-md bg-primary hover:bg-primary-active text-on-primary disabled:opacity-40 disabled:pointer-events-none flex items-center gap-2 transition-all active:scale-95 disabled:active:scale-100 shadow-[var(--shadow-level-1)] disabled:shadow-none"
          >
            <span className="text-sm sm:text-base font-medium">Next</span>
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      </footer>

      {showKickConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={cancelKickParticipant}
          />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-surface border border-hairline p-6 sm:p-8 shadow-[var(--shadow-level-2)]">
            <h2 className="text-xl sm:text-2xl font-semibold text-ink mb-3">{t('presentation.kick_participant_title')}</h2>
            <p className="text-ink-muted mb-6 text-sm sm:text-base">
              {t('presentation.kick_participant_description', { participant: participantToKick })}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={cancelKickParticipant}
                className="px-4 py-2 rounded-md border border-hairline bg-surface text-ink hover:bg-canvas-soft transition-all active:scale-95"
              >
                {t('presentation.cancel')}
              </button>
              <button
                type="button"
                onClick={confirmKickParticipant}
                className="px-4 py-2 bg-red-500 text-white hover:bg-red-600 transition-all rounded-md active:scale-95 shadow-[var(--shadow-level-1)]"
              >
                {t('presentation.kick')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleCancelEndPresentation}
          />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-surface border border-hairline p-6 sm:p-8 shadow-[var(--shadow-level-2)]">
            <h2 className="text-xl sm:text-2xl font-semibold text-ink mb-3">{t('presentation.end_presentation_title') || 'End presentation?'}</h2>
            <p className="text-ink-muted mb-6 text-sm sm:text-base">
              {t('presentation.end_presentation_description') || "Participants will be disconnected and won't be able to submit further responses."}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelEndPresentation}
                className="px-4 py-2 rounded-md border border-hairline bg-surface text-ink hover:bg-canvas-soft transition-all active:scale-95"
              >
                {t('presentation.cancel') || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmEndPresentation}
                className="px-4 py-2 bg-red-500 text-white hover:bg-red-600 transition-all rounded-md active:scale-95 shadow-[var(--shadow-level-1)]"
              >
                {t('presentation.end_presentation') || 'End Presentation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Emoji Reactions Overlay */}
      <FloatingReactionsOverlay socket={socket} />

      {/* Live Chat Drawer */}
      <LiveChatDrawer
        isOpen={showChatDrawer}
        onClose={() => setShowChatDrawer(false)}
        socket={socket}
        presentationId={id}
        isPresenter={true}
      />
    </div>
  );
};

export default PresentMode;
