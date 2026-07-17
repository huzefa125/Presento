import { Type, ThumbsUp, Play, Pause } from 'lucide-react';
import { useMemo } from 'react';

const TypeAnswerPresenterView = ({
  slide,
  responses = [],
  settings,
  onToggleVoting
}) => {
  const {
    isVotingEnabled = false,
  } = settings || {};

  const totalVotes = useMemo(() => {
    return responses.reduce((sum, item) => sum + (item.voteCount || 0), 0);
  }, [responses]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="bg-[#1F1F1F] rounded-2xl sm:rounded-3xl border border-[#2A2A2A] shadow-xl p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#E0E0E0] leading-tight">
              {slide?.question || 'Type your answer'}
            </h2>
            <p className="text-xs sm:text-sm text-[#6C6C6C] mt-2">
              {isVotingEnabled
                ? 'Voting is active. Audience votes update in real time.'
                : 'Collecting responses. Start voting to let the audience pick favourites.'}
            </p>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => onToggleVoting(!isVotingEnabled)}
              className={`inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-3 rounded-xl font-semibold transition-all active:scale-95 ${isVotingEnabled ? 'bg-[#EF5350] hover:bg-[#E53935] text-white shadow-lg shadow-red-500/20' : 'bg-gradient-to-r from-[#388E3C] to-[#2E7D32] hover:from-[#4CAF50] hover:to-[#388E3C] text-white shadow-lg shadow-[#4CAF50]/20'}`}
            >
              {isVotingEnabled ? <Pause className="h-4 w-4 sm:h-5 sm:w-5" /> : <Play className="h-4 w-4 sm:h-5 sm:w-5" />}
              <span className="text-sm sm:text-base">{isVotingEnabled ? 'Stop voting' : 'Start voting'}</span>
            </button>
            <div className={`px-4 py-3 rounded-2xl border ${isVotingEnabled ? 'border-[#4CAF50]/30 bg-[#1D2A20] text-[#4CAF50]' : 'border-[#2A2A2A] bg-[#2A2A2A] text-[#6C6C6C]'} flex flex-col items-start gap-1 min-w-[12rem]`}>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Type className="h-4 w-4" />
                <span>{responses.length} responses</span>
              </div>
              <span className="text-xs">{totalVotes} total votes</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-base sm:text-lg font-semibold text-[#E0E0E0] mb-3 sm:mb-4">Audience responses</h3>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {responses.map((response) => (
            <div
              key={response.id}
              className={`group rounded-2xl sm:rounded-3xl border ${isVotingEnabled ? 'border-[#4CAF50]/30 bg-[#1D2A20]' : 'border-[#2A2A2A] bg-[#1F1F1F]'} shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}
              style={{ transitionProperty: 'transform, box-shadow' }}
            >
              <div className="p-4 sm:p-5 space-y-4">
                <p className="text-base sm:text-lg text-[#E0E0E0] leading-relaxed">{response.text}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-[#4CAF50]">
                    <ThumbsUp className="h-4 w-4" />
                    {response.voteCount || 0}
                    <span className="text-xs uppercase tracking-wide text-[#6C6C6C]">votes</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {responses.length === 0 && (
          <div className="mt-6 border border-dashed border-[#2A2A2A] rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center text-[#6C6C6C]">
            Responses will appear here live as participants submit them.
          </div>
        )}
      </div>
    </div>
  );
};

export default TypeAnswerPresenterView;