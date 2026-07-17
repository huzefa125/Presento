import { useMemo } from 'react';
import { Send, ThumbsUp } from 'lucide-react';

const MAX_CHARACTERS = 300;

const TypeAnswerParticipantView = ({
  slide,
  responses,
  answer,
  onAnswerChange,
  onSubmit,
  hasSubmitted,
  isVotingEnabled,
  participantId,
  onVote
}) => {
  const canVoteOnResponse = (response) => {
    if (!isVotingEnabled) return false;
    const voters = Array.isArray(response.voters) ? response.voters : [];
    return !voters.includes(participantId);
  };

  const remainingCharacters = MAX_CHARACTERS - (answer?.length || 0);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 sm:space-y-8">
      <div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-ink text-center leading-tight">
          {slide?.question}
        </h2>
        {!isVotingEnabled && (
          <p className="text-center text-ink-muted mt-2 text-sm sm:text-base">Share your thoughts below. You can submit once.</p>
        )}
        {isVotingEnabled && (
          <p className="text-center text-accent-green mt-2 font-medium text-sm sm:text-base">Voting is live! Cast your vote below.</p>
        )}
      </div>

      {!isVotingEnabled ? (
        <div className="bg-surface rounded-2xl border border-hairline shadow-[var(--shadow-level-1)] p-4 sm:p-6 space-y-4">
          <textarea
            value={answer}
            onChange={(e) => onAnswerChange(e.target.value.slice(0, MAX_CHARACTERS))}
            disabled={hasSubmitted}
            placeholder="Type your response here (max 300 characters)..."
            rows={4}
            className={`w-full px-4 py-3 bg-surface border border-hairline rounded-xs text-ink resize-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-ink-faint ${hasSubmitted ? 'cursor-not-allowed opacity-60' : ''}`}
          />
          <div className="flex items-center justify-between text-xs sm:text-sm text-ink-faint">
            <span>{remainingCharacters} characters remaining</span>
            {hasSubmitted && <span className="text-accent-green font-medium">Response submitted!</span>}
          </div>
          {!hasSubmitted && (
            <button
              onClick={onSubmit}
              disabled={!answer?.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary-active disabled:bg-canvas-soft disabled:text-ink-faint text-on-primary rounded-full font-semibold transition-all active:scale-95 disabled:active:scale-100 shadow-[var(--shadow-level-1)] disabled:shadow-none"
            >
              <Send className="h-5 w-5" />
              Submit Response
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-accent-green/30 bg-accent-green/10 px-4 py-3 text-sm text-accent-green">
            Voting is live! Vote for your favorite responses.
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-semibold text-ink">Live responses</h3>
              <span className="text-xs sm:text-sm text-ink-faint">{responses?.length || 0} submitted</span>
            </div>

            <div className="grid gap-3">
              {(responses || []).map((response) => {
                const voters = Array.isArray(response.voters) ? response.voters : [];
                const userVoted = voters.includes(participantId);
                return (
                  <div
                    key={response.id}
                    className="rounded-2xl border border-hairline bg-surface shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:border-ink-faint/50"
                  >
                    <div className="p-4">
                      <p className="text-base sm:text-lg text-ink mb-4">{response.text}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-ink-muted">
                          <ThumbsUp className="h-4 w-4 text-accent-green" />
                          <span className="font-medium text-ink">{response.voteCount || 0}</span>
                          <span className="text-ink-faint">votes</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onVote(response.id)}
                          disabled={!canVoteOnResponse(response)}
                          className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all active:scale-95 flex items-center gap-2 ${canVoteOnResponse(response)
                            ? 'bg-primary hover:bg-primary-active text-on-primary shadow-[var(--shadow-level-1)]'
                            : userVoted
                              ? 'bg-accent-green/10 border border-accent-green/30 text-accent-green cursor-default'
                              : 'bg-canvas-soft text-ink-faint cursor-not-allowed border border-hairline'}`}
                        >
                          <ThumbsUp className="h-4 w-4" />
                          {userVoted ? 'Voted' : 'Vote'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {responses?.length === 0 && (
              <div className="border border-dashed border-hairline bg-canvas-soft rounded-2xl p-8 text-center text-ink-faint">
                Responses will appear here in real time.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TypeAnswerParticipantView;