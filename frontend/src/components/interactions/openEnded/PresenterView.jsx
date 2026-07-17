import { ThumbsUp, Play, Pause } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const OpenEndedPresenter = ({
  slide,
  responses = [],
  settings,
  onToggleVoting
}) => {
  const { t } = useTranslation();
  const {
    isVotingEnabled = false,
  } = settings || {};

  const totalVotes = useMemo(() => {
    return responses.reduce((sum, item) => sum + (item.voteCount || 0), 0);
  }, [responses]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="bg-surface rounded-xl border border-hairline p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-ink leading-tight">
              {slide?.question || t('slide_editors.open_ended.default_title')}
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted mt-2">
              {isVotingEnabled
                ? t('slide_editors.open_ended.voting_active')
                : t('slide_editors.open_ended.collecting_responses')}
            </p>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => onToggleVoting(!isVotingEnabled)}
              className={`inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-3 rounded-full font-semibold transition-all active:scale-95 ${isVotingEnabled ? 'bg-surface text-ink border border-hairline hover:bg-canvas-soft' : 'bg-primary hover:bg-primary-active text-on-primary shadow-[var(--shadow-level-1)]'}`}
            >
              {isVotingEnabled ? <Pause className="h-4 w-4 sm:h-5 sm:w-5" /> : <Play className="h-4 w-4 sm:h-5 sm:w-5" />}
              <span className="text-sm sm:text-base">{isVotingEnabled ? t('slide_editors.open_ended.stop_voting') : t('slide_editors.open_ended.start_voting')}</span>
            </button>
            <div className={`px-4 py-3 rounded-xl border ${isVotingEnabled ? 'border-accent-green/30 bg-accent-green/10 text-accent-green' : 'border-hairline bg-canvas-soft text-ink-muted'} flex flex-col items-start gap-1 min-w-[12rem]`}>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ThumbsUp className="h-4 w-4" />
                <span>{t('slide_editors.open_ended.responses_count', { count: responses.length })}</span>
              </div>
              <span className="text-xs">{t('slide_editors.open_ended.total_votes', { count: totalVotes })}</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-base sm:text-lg font-semibold text-ink mb-3 sm:mb-4">{t('slide_editors.open_ended.audience_responses')}</h3>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {responses.map((response) => (
            <div
              key={response.id}
              className={`group rounded-xl border ${isVotingEnabled ? 'border-accent-green/30 bg-accent-green/5' : 'border-hairline bg-surface'} transition-all duration-300 hover:shadow-[var(--shadow-level-1)] hover:-translate-y-1`}
              style={{ transitionProperty: 'transform, box-shadow' }}
            >
              <div className="p-4 sm:p-5 space-y-4">
                <p className="text-base sm:text-lg text-ink leading-relaxed">{response.text}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-accent-green">
                    <ThumbsUp className="h-4 w-4" />
                    {response.voteCount || 0}
                    <span className="text-xs uppercase tracking-wide text-ink-muted">{t('slide_editors.open_ended.votes')}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {responses.length === 0 && (
          <div className="mt-6 border border-dashed border-hairline rounded-xl p-8 sm:p-12 text-center text-ink-muted">
            {t('slide_editors.open_ended.responses_will_appear')}
          </div>
        )}
      </div>
    </div>
  );
};

export default OpenEndedPresenter;
