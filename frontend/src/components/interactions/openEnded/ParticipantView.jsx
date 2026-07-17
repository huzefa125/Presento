import { useMemo } from 'react';
import { Send, ThumbsUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_CHARACTERS = 300;

const ParticipantOpenEnded = ({
  slide,
  responses,
  answer,
  onAnswerChange,
  onSubmit,
  hasSubmitted,
  isVotingEnabled,
  participantId,
  onVote,
  totalResponses = 0
}) => {
  const { t } = useTranslation();
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
          <p className="text-center text-ink-secondary mt-2 text-sm sm:text-base">{t('slide_editors.open_ended.share_thoughts')}</p>
        )}
        {isVotingEnabled && (
          <p className="text-center text-accent-green mt-2 font-medium text-sm sm:text-base">{t('slide_editors.open_ended.voting_live')}</p>
        )}
      </div>

      {!isVotingEnabled ? (
        <div className="space-y-6">
          {!hasSubmitted ? (
            <div className="bg-surface rounded-xl border border-hairline shadow-[var(--shadow-level-1)] p-4 sm:p-6 space-y-4">
              <textarea
                value={answer}
                onChange={(e) => onAnswerChange(e.target.value.slice(0, MAX_CHARACTERS))}
                disabled={hasSubmitted}
                placeholder={t('slide_editors.open_ended.response_placeholder')}
                rows={4}
                className="w-full px-4 py-3 bg-surface border border-hairline rounded-xs text-ink resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-ink-faint"
              />
              <div className="flex items-center justify-between text-xs sm:text-sm text-ink-muted">
                <span>{t('slide_editors.open_ended.characters_remaining', { count: remainingCharacters })}</span>
              </div>
              <button
                onClick={onSubmit}
                disabled={!answer?.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary-active disabled:bg-canvas-soft disabled:text-ink-faint text-on-primary rounded-full font-semibold transition-all active:scale-95 disabled:active:scale-100 shadow-[var(--shadow-level-1)] disabled:shadow-none"
              >
                <Send className="h-5 w-5" />
                {t('slide_editors.open_ended.submit_response')}
              </button>
            </div>
          ) : (
            <>
              {/* Submission confirmation */}
              <div className="bg-accent-green/10 border border-accent-green/30 rounded-xl p-6 text-center">
                <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse"></div>
                  <p className="text-base sm:text-lg text-accent-green font-semibold">
                    ✓ Response submitted! Viewing all responses...
                  </p>
                </div>
              </div>

              {/* All Responses */}
              {responses && responses.length > 0 && (
                <div className="bg-surface rounded-xl border border-hairline p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl sm:text-2xl font-semibold text-ink">All Responses</h3>
                    <div className="flex items-center gap-2 text-sm text-ink-muted">
                      <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse"></div>
                      <span>{responses.length} {responses.length === 1 ? 'response' : 'responses'}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {responses.map((response, index) => {
                      const isYourResponse = response.participantId === participantId;

                      return (
                        <div
                          key={response.id || index}
                          className={`rounded-lg border p-4 transition-all ${
                            isYourResponse
                              ? 'border-accent-green bg-accent-green/10'
                              : 'border-hairline bg-canvas-soft'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <p className={`flex-1 text-base sm:text-lg ${
                              isYourResponse ? 'text-accent-green font-medium' : 'text-ink'
                            }`}>
                              {response.text}
                            </p>
                            {isYourResponse && (
                              <span className="px-2 py-1 rounded bg-accent-green/15 text-accent-green text-xs font-bold whitespace-nowrap">
                                Your Response
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {(!responses || responses.length === 0) && (
                <div className="bg-surface rounded-xl border border-hairline p-8 text-center">
                  <p className="text-ink-muted">No responses yet. Waiting for others to submit...</p>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-accent-green/30 bg-accent-green/10 px-4 py-3 text-sm text-accent-green">
            {t('slide_editors.open_ended.voting_live_instruction')}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-semibold text-ink">{t('slide_editors.open_ended.live_responses')}</h3>
              <span className="text-xs sm:text-sm text-ink-muted">{t('slide_editors.open_ended.submitted_count', { count: responses?.length || 0 })}</span>
            </div>

            <div className="grid gap-3">
              {(responses || []).map((response) => {
                const voters = Array.isArray(response.voters) ? response.voters : [];
                const userVoted = voters.includes(participantId);
                return (
                  <div
                    key={response.id}
                    className="rounded-xl border border-hairline bg-surface transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-level-1)]"
                  >
                    <div className="p-4">
                      <p className="text-base sm:text-lg text-ink mb-4">{response.text}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-ink-secondary">
                          <ThumbsUp className="h-4 w-4 text-accent-green" />
                          <span className="font-medium text-ink">{response.voteCount || 0}</span>
                          <span className="text-ink-muted">{t('slide_editors.open_ended.votes')}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onVote(response.id)}
                          disabled={!canVoteOnResponse(response)}
                          className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all active:scale-95 flex items-center gap-2 ${canVoteOnResponse(response)
                            ? 'bg-primary hover:bg-primary-active text-on-primary shadow-[var(--shadow-level-1)]'
                            : userVoted
                              ? 'bg-accent-green/10 border border-accent-green/30 text-accent-green cursor-default'
                              : 'bg-canvas-soft text-ink-faint cursor-not-allowed'}`}
                        >
                          <ThumbsUp className="h-4 w-4" />
                          {userVoted ? t('slide_editors.open_ended.voted') : t('slide_editors.open_ended.vote')}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {responses?.length === 0 && (
              <div className="border border-dashed border-hairline rounded-xl p-8 text-center text-ink-muted">
                {t('slide_editors.open_ended.no_responses')}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ParticipantOpenEnded;