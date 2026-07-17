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
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#E0E0E0] text-center leading-tight">
          {slide?.question}
        </h2>
        {!isVotingEnabled && (
          <p className="text-center text-[#B0B0B0] mt-2 text-sm sm:text-base">Share your thoughts below. You can submit once.</p>
        )}
        {isVotingEnabled && (
          <p className="text-center text-[#4CAF50] mt-2 font-medium text-sm sm:text-base">Voting is live! Cast your vote below.</p>
        )}
      </div>

      {!isVotingEnabled ? (
        <div className="bg-[#1F1F1F] rounded-2xl border border-[#2A2A2A] shadow-lg p-4 sm:p-6 space-y-4">
          <textarea
            value={answer}
            onChange={(e) => onAnswerChange(e.target.value.slice(0, MAX_CHARACTERS))}
            disabled={hasSubmitted}
            placeholder="Type your response here (max 300 characters)..."
            rows={4}
            className={`w-full px-4 py-3 bg-[#2A2A2A] border border-[#2F2F2F] rounded-xl text-[#E0E0E0] resize-none focus:ring-2 focus:ring-[#4CAF50] focus:border-[#4CAF50] transition-all placeholder-[#6C6C6C] ${hasSubmitted ? 'cursor-not-allowed opacity-60' : ''}`}
          />
          <div className="flex items-center justify-between text-xs sm:text-sm text-[#6C6C6C]">
            <span>{remainingCharacters} characters remaining</span>
            {hasSubmitted && <span className="text-[#4CAF50] font-medium">Response submitted!</span>}
          </div>
          {!hasSubmitted && (
            <button
              onClick={onSubmit}
              disabled={!answer?.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#388E3C] to-[#2E7D32] hover:from-[#4CAF50] hover:to-[#388E32] disabled:from-[#1F1F1F] disabled:to-[#1F1F1F] disabled:text-[#6C6C6C] text-white rounded-xl font-semibold transition-all active:scale-95 disabled:active:scale-100 shadow-lg shadow-[#4CAF50]/20 disabled:shadow-none"
            >
              <Send className="h-5 w-5" />
              Submit Response
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-[#2E7D32]/30 bg-[#1D2A20] px-4 py-3 text-sm text-[#4CAF50]">
            Voting is live! Vote for your favorite responses.
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-semibold text-[#E0E0E0]">Live responses</h3>
              <span className="text-xs sm:text-sm text-[#6C6C6C]">{responses?.length || 0} submitted</span>
            </div>

            <div className="grid gap-3">
              {(responses || []).map((response) => {
                const voters = Array.isArray(response.voters) ? response.voters : [];
                const userVoted = voters.includes(participantId);
                return (
                  <div
                    key={response.id}
                    className="rounded-2xl border border-[#2A2A2A] bg-[#1F1F1F] shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:border-[#2F2F2F]"
                  >
                    <div className="p-4">
                      <p className="text-base sm:text-lg text-[#E0E0E0] mb-4">{response.text}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-[#B0B0B0]">
                          <ThumbsUp className="h-4 w-4 text-[#4CAF50]" />
                          <span className="font-medium text-[#E0E0E0]">{response.voteCount || 0}</span>
                          <span className="text-[#6C6C6C]">votes</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onVote(response.id)}
                          disabled={!canVoteOnResponse(response)}
                          className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all active:scale-95 flex items-center gap-2 ${canVoteOnResponse(response)
                            ? 'bg-gradient-to-r from-[#388E3C] to-[#2E7D32] hover:from-[#4CAF50] hover:to-[#388E32] text-white shadow-lg shadow-[#4CAF50]/20'
                            : userVoted
                              ? 'bg-[#1D2A20] border border-[#2E7D32]/30 text-[#4CAF50] cursor-default'
                              : 'bg-[#2A2A2A] text-[#6C6C6C] cursor-not-allowed'}`}
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
              <div className="border border-dashed border-[#2A2A2A] rounded-2xl p-8 text-center text-[#6C6C6C]">
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