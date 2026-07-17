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
      <div className="bg-surface rounded-2xl sm:rounded-3xl border border-hairline shadow-[var(--shadow-level-1)] p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-ink leading-tight">
              {slide?.question || 'Type your answer'}
            </h2>
            <p className="text-xs sm:text-sm text-ink-faint mt-2">
              {isVotingEnabled
                ? 'Voting is active. Audience votes update in real time.'
                : 'Collecting responses. Start voting to let the audience pick favourites.'}
            </p>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => onToggleVoting(!isVotingEnabled)}
              className={`inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-3 rounded-full font-semibold transition-all active:scale-95 ${isVotingEnabled ? 'bg-surface text-ink border border-hairline hover:bg-canvas-soft' : 'bg-primary hover:bg-primary-active text-on-primary shadow-[var(--shadow-level-1)]'}`}
            >
              {isVotingEnabled ? <Pause className="h-4 w-4 sm:h-5 sm:w-5" /> : <Play className="h-4 w-4 sm:h-5 sm:w-5" />}
              <span className="text-sm sm:text-base">{isVotingEnabled ? 'Stop voting' : 'Start voting'}</span>
            </button>
            <div className={`px-4 py-3 rounded-2xl border ${isVotingEnabled ? 'border-accent-green/30 bg-accent-green/10 text-accent-green' : 'border-hairline bg-canvas-soft text-ink-faint'} flex flex-col items-start gap-1 min-w-[12rem]`}>
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
        <h3 className="text-base sm:text-lg font-semibold text-ink mb-3 sm:mb-4">Audience responses</h3>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {responses.map((response) => (
            <div
              key={response.id}
              className={`group rounded-2xl sm:rounded-3xl border ${isVotingEnabled ? 'border-accent-green/30 bg-accent-green/10' : 'border-hairline bg-surface'} shadow-sm transition-all duration-300 hover:shadow-[var(--shadow-level-1)] hover:-translate-y-1`}
              style={{ transitionProperty: 'transform, box-shadow' }}
            >
              <div className="p-4 sm:p-5 space-y-4">
                <p className="text-base sm:text-lg text-ink leading-relaxed">{response.text}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-accent-green">
                    <ThumbsUp className="h-4 w-4" />
                    {response.voteCount || 0}
                    <span className="text-xs uppercase tracking-wide text-ink-faint">votes</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {responses.length === 0 && (
          <div className="mt-6 border border-dashed border-hairline bg-canvas-soft rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center text-ink-faint">
            Responses will appear here live as participants submit them.
          </div>
        )}
      </div>
    </div>
  );
};

export default TypeAnswerPresenterView;