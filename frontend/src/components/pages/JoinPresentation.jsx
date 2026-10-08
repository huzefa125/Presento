import { Loader2, LogOut, MessageSquare } from 'lucide-react';
import LiveChatDrawer from '../presentation/LiveChatDrawer';
import FloatingReactionsOverlay from '../presentation/FloatingReactionsOverlay';
import { getThemeStyleVars } from '../../constants/themes';
import RankingParticipantInput from '../interactions/ranking/ParticipantInput';
import HundredPointsParticipantInput from '../interactions/hundredPoints/ParticipantInput';
import WordCloudParticipantInput from '../interactions/wordCloud/ParticipantInput';
import ScalesParticipantInput from '../interactions/scales/ParticipantInput';
import ParticipantOpenEnded from '../interactions/openEnded/ParticipantView';
import TypeAnswerParticipantView from '../interactions/typeAnswer/participant/ParticipantView';
import ParticipantQnaView from '../interactions/qna/ParticipantView';
import MCQParticipantInput from '../interactions/mcq/ParticipantInput';
import PickAnswerParticipantInput from '../interactions/pickAnswer/participant/ParticipantInput';
import ParticipantGuessView from '../interactions/guessNumber/ParticipantView';
import TwoByTwoGridParticipantInput from '../interactions/twoByTwoGrid/ParticipantInput';
import PinOnImageParticipantInput from '../interactions/pinOnImage/ParticipantInput';
import CompareSlidesParticipantInput from '../interactions/compareSlides/ParticipantInput';
import QuizParticipantInput from '../interactions/quiz/ParticipantInput';
import LeaderboardParticipantView from '../interactions/leaderboard/ParticipantView';
import MiroParticipantView from '../interactions/miro/participant/ParticipantView';
import PowerPointParticipantView from '../interactions/powerpoint/participant/ParticipantView';
import GoogleSlidesParticipantView from '../interactions/googleSlides/participant/ParticipantView';
import PdfParticipantView from '../interactions/pdf/participant/ParticipantView';
import InstructionParticipantView from '../interactions/instruction/participant/ParticipantView';
import SlideCanvas from '../presentation/SlideCanvas';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useJoinPresentationSocket } from '../../hooks/useJoinPresentationSocket';

const JoinPresentation = () => {
  const {
    currentSlide,
    currentUser,
    deniedMessage,
    gridResults,
    guessDistribution,
    handleJoin,
    handleLeave,
    handleSubmitQuizAnswer,
    handleSubmitResponse,
    handleVoteOpenEndedResponse,
    hasJoined,
    hasSubmitted,
    hundredPointsResults,
    isAutoJoining,
    isLeaving,
    isPendingApproval,
    isWaiting,
    joinError,
    kickMessage,
    leaderboard,
    openEndedAnswer,
    openEndedResponses,
    openEndedSettings,
    participantId,
    participantName,
    participantRanking,
    pendingApprovalMessage,
    pinResults,
    presentation,
    presentationEnded,
    qnaActiveQuestionId,
    qnaAllowMultiple,
    qnaQuestions,
    quizState,
    quizSubmissionResult,
    rankingResults,
    scaleAverage,
    scaleDistribution,
    scaleStatementAverages,
    selectedAnswer,
    setOpenEndedAnswer,
    setParticipantName,
    setSelectedAnswer,
    setShowChatDrawer,
    setTextAnswer,
    setUnreadChatCount,
    showChatDrawer,
    showDeniedModal,
    showKickedModal,
    socket,
    socketConnected,
    submissionCount,
    t,
    textAnswer,
    totalResponses,
    unreadChatCount,
    voteCounts,
    waitingMessage,
    wordFrequencies
  } = useJoinPresentationSocket();

  const renderSlideContent = () => {
    if (!currentSlide) return null;

    switch (currentSlide.type) {
      case 'multiple_choice':
        return (
          <MCQParticipantInput
            slide={currentSlide}
            selectedAnswer={selectedAnswer}
            onSelect={setSelectedAnswer}
            hasSubmitted={hasSubmitted}
            voteCounts={voteCounts}
            totalResponses={totalResponses}
            onSubmit={handleSubmitResponse}
          />
        );
      case 'compare_slides':
        return (
          <CompareSlidesParticipantInput
            slide={currentSlide}
            selectedAnswer={selectedAnswer}
            onSelect={setSelectedAnswer}
            hasSubmitted={hasSubmitted}
            voteCounts={voteCounts}
            totalResponses={totalResponses}
            onSubmit={handleSubmitResponse}
          />
        );
      case 'pick_answer':
        return (
          <PickAnswerParticipantInput
            slide={currentSlide}
            selectedAnswer={selectedAnswer}
            onSelect={setSelectedAnswer}
            hasSubmitted={hasSubmitted}
            voteCounts={voteCounts}
            totalResponses={totalResponses}
            onSubmit={handleSubmitResponse}
          />
        );
      case 'word_cloud':
        return (
          <WordCloudParticipantInput
            slide={currentSlide}
            textAnswer={textAnswer}
            onTextChange={setTextAnswer}
            hasSubmitted={hasSubmitted}
            onSubmit={handleSubmitResponse}
            submissionCount={submissionCount}
            maxSubmissions={currentSlide.maxWordsPerParticipant || 1}
            wordFrequencies={wordFrequencies}
            totalResponses={totalResponses}
          />
        );
      case 'open_ended':
        return (
          <ParticipantOpenEnded
            slide={currentSlide}
            responses={openEndedResponses}
            answer={openEndedAnswer}
            onAnswerChange={setOpenEndedAnswer}
            onSubmit={handleSubmitResponse}
            hasSubmitted={hasSubmitted}
            isVotingEnabled={openEndedSettings.isVotingEnabled}
            participantId={participantId}
            onVote={handleVoteOpenEndedResponse}
            totalResponses={totalResponses}
          />
        );
      case 'type_answer':
        return (
          <TypeAnswerParticipantView
            slide={currentSlide}
            responses={openEndedResponses}
            answer={openEndedAnswer}
            onAnswerChange={setOpenEndedAnswer}
            onSubmit={handleSubmitResponse}
            hasSubmitted={hasSubmitted}
            isVotingEnabled={openEndedSettings.isVotingEnabled}
            participantId={participantId}
            onVote={handleVoteOpenEndedResponse}
          />
        );
      case 'scales':
        return (
          <ScalesParticipantInput
            slide={currentSlide}
            onSubmit={handleSubmitResponse}
            hasSubmitted={hasSubmitted}
            scaleDistribution={scaleDistribution}
            scaleAverage={scaleAverage}
            scaleStatementAverages={scaleStatementAverages}
            totalResponses={totalResponses}
          />
        );
      case 'ranking':
        return (
          <RankingParticipantInput
            slide={currentSlide}
            onSubmit={handleSubmitResponse}
            hasSubmitted={hasSubmitted}
            initialRanking={participantRanking}
            rankingResults={rankingResults}
            totalResponses={totalResponses}
          />
        );
      case 'qna':
        return (
          <ParticipantQnaView
            slide={currentSlide}
            questions={qnaQuestions}
            allowMultiple={qnaAllowMultiple}
            activeQuestionId={qnaActiveQuestionId}
            participantId={participantId}
            onSubmit={(text) => {
              if (!socket) return;
              socket.emit('submit-qna-question', {
                presentationId: presentation.id,
                slideId: currentSlide.id,
                participantId,
                participantName,
                text
              });
            }}
          />
        );
      case 'guess_number':
        return (
          <ParticipantGuessView
            slide={currentSlide}
            hasSubmitted={hasSubmitted}
            guessDistribution={guessDistribution}
            totalResponses={totalResponses}
            onSubmit={(guess) => {
              if (!socket) return;
              socket.emit('submit-guess', {
                presentationId: presentation.id,
                slideId: currentSlide.id,
                participantId,
                guess
              });
            }}
          />
        );
      case 'hundred_points':
        return (
          <HundredPointsParticipantInput
            slide={currentSlide}
            onSubmit={handleSubmitResponse}
            hasSubmitted={hasSubmitted}
            hundredPointsResults={hundredPointsResults}
            totalResponses={totalResponses}
          />
        );
      case '2x2_grid':
        return (
          <TwoByTwoGridParticipantInput
            slide={currentSlide}
            onSubmit={handleSubmitResponse}
            hasSubmitted={hasSubmitted}
            gridResults={gridResults}
            totalResponses={totalResponses}
          />
        );
      case 'pin_on_image':
        return (
          <PinOnImageParticipantInput
            slide={currentSlide}
            onSubmit={handleSubmitResponse}
            hasSubmitted={hasSubmitted}
            pinResults={pinResults}
            totalResponses={totalResponses}
          />
        );
      case 'quiz':
        return (
          <QuizParticipantInput
            slide={currentSlide}
            quizState={quizState}
            hasSubmitted={hasSubmitted}
            submissionResult={quizSubmissionResult}
            voteCounts={voteCounts}
            totalResponses={totalResponses}
            onSubmit={handleSubmitQuizAnswer}
          />
        );
      case 'leaderboard':
        return (
          <LeaderboardParticipantView
            slide={currentSlide}
            leaderboard={leaderboard}
            participantId={participantId}
          />
        );
      case 'miro':
        return (
          <MiroParticipantView
            slide={currentSlide}
          />
        );
      case 'powerpoint':
        return (
          <PowerPointParticipantView
            slide={currentSlide}
          />
        );
      case 'google_slides':
        return (
          <GoogleSlidesParticipantView
            slide={currentSlide}
          />
        );
      case 'pdf':
        return (
          <PdfParticipantView
            slide={currentSlide}
          />
        );
      case 'instruction':
        return (
          <InstructionParticipantView
            slide={currentSlide}
            presentation={presentation}
          />
        );
      case 'video':
        return (
          <SlideCanvas
            slide={currentSlide}
            presentation={presentation}
            isPresenter={false}
          />
        );
      case 'text':
        return (
          <SlideCanvas
            slide={currentSlide}
            presentation={presentation}
            isPresenter={false}
          />
        );
      case 'image':
        return (
          <SlideCanvas
            slide={currentSlide}
            presentation={presentation}
            isPresenter={false}
          />
        );
      default:
        return (
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-ink">
              {typeof currentSlide.question === 'string'
                ? currentSlide.question 
                : (currentSlide.question?.text || currentSlide.question?.label || '')}
            </h2>
          </div>
        );
    }
  };

  if (showKickedModal) {
    return (
      <div className="min-h-screen bg-canvas-soft text-ink flex items-center justify-center p-4">
        <div className="bg-surface border border-hairline rounded-lg shadow-[var(--shadow-level-2)] p-6 sm:p-8 max-w-md w-full text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-ink mb-4">Removed from Presentation</h2>
          <p className="text-ink-muted mb-6">{kickMessage}</p>
          <Button
            variant="primary"
            onClick={() => window.location.href = '/'}
            className="w-full"
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  // Denied Modal
  if (showDeniedModal) {
    return (
      <div className="min-h-screen bg-canvas-soft text-ink flex items-center justify-center p-4">
        <div className="bg-surface border border-hairline rounded-lg shadow-[var(--shadow-level-2)] p-6 sm:p-8 max-w-md w-full text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-ink mb-4">{t('join_presentation.join_denied_title')}</h2>
          <p className="text-ink-muted mb-6">{deniedMessage}</p>
          <Button
            variant="primary"
            onClick={() => window.location.href = '/'}
            className="w-full"
          >
            {t('join_presentation.back_to_home')}
          </Button>
        </div>
      </div>
    );
  }

  // Waiting-room screen: request sent, presenter hasn't responded yet
  if (isPendingApproval) {
    return (
      <div className="min-h-screen bg-canvas-soft text-ink flex items-center justify-center p-4">
        <div className="bg-surface border border-hairline rounded-lg shadow-[var(--shadow-level-1)] p-8 sm:p-12 max-w-md w-full text-center">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <h2 className="text-xl sm:text-2xl font-bold text-ink">{t('join_presentation.waiting_for_approval_title')}</h2>
            <p className="text-ink-muted">{pendingApprovalMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  // Auto-join loading screen for authenticated users
  if (isAutoJoining) {
    return (
      <div className="min-h-screen bg-canvas-soft text-ink flex items-center justify-center p-4">
        <div className="bg-surface border border-hairline rounded-lg shadow-[var(--shadow-level-1)] p-8 max-w-md w-full text-center">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <h2 className="text-xl font-bold text-ink">Joining as {participantName}...</h2>
            <p className="text-ink-muted">Setting up your connection</p>
          </div>
        </div>
      </div>
    );
  }

  // Name entry form (when not joined and not auto-joining)
  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-canvas-soft text-ink flex items-center justify-center p-4">
        <div className="bg-surface border border-hairline rounded-lg shadow-[var(--shadow-level-1)] p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-ink mb-2">{t('join_presentation.join_presentation_title')}</h1>
            <p className="text-ink-muted">{t('join_presentation.enter_your_name')}</p>
          </div>

          <div className="space-y-6">
            <div>
              <Input
                type="text"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder={t('join_presentation.name_placeholder')}
                onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
              />
              {joinError && (
                <p className="mt-2 text-red-600 text-sm">{joinError}</p>
              )}
            </div>

            <Button
              variant="primary"
              onClick={handleJoin}
              className="w-full"
            >
              {t('join_presentation.continue')}
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // If user is logged in but socket is not connected yet (waiting for connection)
  if (currentUser && currentUser.displayName && socket && !socketConnected && !hasJoined && !isAutoJoining) {
    return (
      <div className="min-h-screen bg-canvas-soft text-ink flex items-center justify-center p-4">
        <div className="bg-surface border border-hairline rounded-lg shadow-[var(--shadow-level-1)] p-8 max-w-md w-full text-center">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <h2 className="text-xl font-bold text-ink">{t('join_presentation.preparing_to_join', { name: currentUser.displayName })}</h2>
            <p className="text-ink-muted">{t('join_presentation.setting_up_connection')}</p>
          </div>
        </div>
      </div>
    );
  }

  // Waiting screen
  if (isWaiting) {
    return (
      <div className="min-h-screen bg-canvas-soft text-ink flex items-center justify-center p-4">
        <div className="bg-surface border border-hairline rounded-lg shadow-[var(--shadow-level-1)] p-12 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-ink mb-6">
            {waitingMessage || t('join_presentation.waiting_for_presentation')}
          </h2>
          {presentationEnded && (
            <Button
              variant="secondary"
              onClick={handleLeave}
              className="mt-4 text-red-600"
            >
              <LogOut className="w-5 h-5" />
              {t('join_presentation.leave')}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Presentation screen
  return (
    <div className="h-screen bg-canvas-soft text-ink flex flex-col overflow-hidden" style={getThemeStyleVars(presentation?.theme)}>
      {/* Top Bar */}
      <div className="bg-surface border-b border-hairline px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold text-ink truncate">{presentation?.title || t('presentation.untitled')}</h1>
            <p className="text-xs sm:text-sm text-ink-muted">{t('presentation.welcome')}, <span className="text-accent-green font-medium">{participantName}</span>!</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-canvas-soft border border-hairline rounded-md flex items-center gap-2">
              <div className="w-2 h-2 bg-accent-green rounded-full animate-pulse"></div>
              <span className="text-xs sm:text-sm font-medium text-accent-green">{t('presentation.live')}</span>
            </div>

            {/* Live Chat Button */}
            <button
              onClick={() => {
                setShowChatDrawer(!showChatDrawer);
                setUnreadChatCount(0);
              }}
              className="relative px-3 sm:px-4 py-1.5 sm:py-2 bg-canvas-soft hover:bg-surface border border-hairline text-ink rounded-md transition-all cursor-pointer flex items-center gap-2"
              title="Live Chat"
            >
              <MessageSquare className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium hidden sm:inline">Chat</span>
              {unreadChatCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                  {unreadChatCount > 9 ? '9+' : unreadChatCount}
                </span>
              )}
            </button>

            <button
              onClick={handleLeave}
              disabled={isLeaving}
              className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-canvas-soft border border-hairline text-red-600 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title={t('join_presentation.leave_presentation') || 'Leave Presentation'}
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">
                {t('join_presentation.leave') || 'Leave'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 sm:py-8 custom-scrollbar min-h-0">
        <div className="max-w-6xl mx-auto w-full">
          <div className="w-full bg-surface rounded-lg border border-hairline shadow-[var(--shadow-level-1)] p-6 sm:p-8 lg:p-10">
            {renderSlideContent()}
          </div>
        </div>
      </div>

      {/* Floating Emoji Reactions Overlay */}
      <FloatingReactionsOverlay socket={socket} />

      {/* Live Chat Drawer */}
      <LiveChatDrawer
        isOpen={showChatDrawer}
        onClose={() => setShowChatDrawer(false)}
        socket={socket}
        presentationId={presentation?.id || presentation?._id || currentSlide?.presentationId}
        isPresenter={false}
        participantName={participantName}
        participantId={participantId}
      />
    </div>
  );
};

export default JoinPresentation;
