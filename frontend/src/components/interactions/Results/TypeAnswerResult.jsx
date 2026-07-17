import React, { useState } from 'react';
import { ThumbsUp, Clock, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const TypeAnswerResult = ({ slide, data }) => {
  const { t } = useTranslation();
  // Backend returns responses array directly
  const responses = data?.responses || [];
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, popular

  // Sort responses based on selected criteria
  const sortedResponses = [...responses].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return (b.voteCount || 0) - (a.voteCount || 0);
      case 'oldest':
        return new Date(a.submittedAt) - new Date(b.submittedAt);
      case 'newest':
      default:
        return new Date(b.submittedAt) - new Date(a.submittedAt);
    }
  });

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-surface rounded-xl border border-hairline p-6">
        <h3 className="text-xl font-semibold text-ink mb-4">{t('presentation_results.common_labels.question')}</h3>
        <p className="text-ink text-lg">
          {typeof slide.question === 'string'
            ? slide.question
            : (slide.question?.text || slide.question?.label || '')}
        </p>
      </div>

      {/* Sorting controls */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-ink">
          {t('presentation_results.common_labels.response')}s ({responses.length})
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy('newest')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              sortBy === 'newest'
                ? 'bg-primary text-on-primary'
                : 'bg-canvas-soft text-ink-muted hover:bg-surface border border-hairline'
            }`}
          >
            {t('presentation_results.common_labels.newest')}
          </button>
          <button
            onClick={() => setSortBy('oldest')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              sortBy === 'oldest'
                ? 'bg-primary text-on-primary'
                : 'bg-canvas-soft text-ink-muted hover:bg-surface border border-hairline'
            }`}
          >
            {t('presentation_results.common_labels.oldest')}
          </button>
          {slide.openEndedSettings?.isVotingEnabled && (
            <button
              onClick={() => setSortBy('popular')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                sortBy === 'popular'
                  ? 'bg-primary text-on-primary'
                  : 'bg-canvas-soft text-ink-muted hover:bg-surface border border-hairline'
              }`}
            >
              {t('presentation_results.common_labels.popular')}
            </button>
          )}
        </div>
      </div>

      {/* Responses list */}
      <div className="space-y-4">
        {sortedResponses.length === 0 ? (
          <div className="bg-surface rounded-xl border border-hairline p-8 text-center">
            <p className="text-ink-muted">{t('presentation_results.common_labels.no_responses_yet')}</p>
          </div>
        ) : (
          sortedResponses.map((response) => (
            <div
              key={response.id}
              className="bg-surface rounded-xl border border-hairline p-5 hover:border-accent-green/40 transition-colors"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-accent-green" />
                  <span className="font-medium text-ink">
                    {response.participantName || t('presentation_results.common_labels.anonymous')}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {slide.openEndedSettings?.isVotingEnabled && (
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-4 w-4 text-ink-muted" />
                      <span className="text-sm text-ink-muted">{response.voteCount || 0}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-ink-faint">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">{formatDate(response.submittedAt)}</span>
                  </div>
                </div>
              </div>
              <div className="text-ink whitespace-pre-wrap">
                {response.text || 'No response text'}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TypeAnswerResult;