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
      <div className="bg-[#1F1F1F] rounded-xl border border-[#2A2A2A] p-6">
        <h3 className="text-xl font-semibold text-[#E0E0E0] mb-4">{t('presentation_results.common_labels.question')}</h3>
        <p className="text-[#E0E0E0] text-lg">
          {typeof slide.question === 'string' 
            ? slide.question 
            : (slide.question?.text || slide.question?.label || '')}
        </p>
      </div>

      {/* Sorting controls */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-[#E0E0E0]">
          {t('presentation_results.common_labels.response')}s ({responses.length})
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy('newest')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              sortBy === 'newest'
                ? 'bg-[#4CAF50] text-white'
                : 'bg-[#2A2A2A] text-[#9E9E9E] hover:bg-[#333333]'
            }`}
          >
            {t('presentation_results.common_labels.newest')}
          </button>
          <button
            onClick={() => setSortBy('oldest')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              sortBy === 'oldest'
                ? 'bg-[#4CAF50] text-white'
                : 'bg-[#2A2A2A] text-[#9E9E9E] hover:bg-[#333333]'
            }`}
          >
            {t('presentation_results.common_labels.oldest')}
          </button>
          {slide.openEndedSettings?.isVotingEnabled && (
            <button
              onClick={() => setSortBy('popular')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                sortBy === 'popular'
                  ? 'bg-[#4CAF50] text-white'
                  : 'bg-[#2A2A2A] text-[#9E9E9E] hover:bg-[#333333]'
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
          <div className="bg-[#1F1F1F] rounded-xl border border-[#2A2A2A] p-8 text-center">
            <p className="text-[#9E9E9E]">{t('presentation_results.common_labels.no_responses_yet')}</p>
          </div>
        ) : (
          sortedResponses.map((response) => (
            <div
              key={response.id}
              className="bg-[#1F1F1F] rounded-xl border border-[#2A2A2A] p-5 hover:border-[#4CAF50]/30 transition-colors"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-[#4CAF50]" />
                  <span className="font-medium text-[#E0E0E0]">
                    {response.participantName || t('presentation_results.common_labels.anonymous')}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {slide.openEndedSettings?.isVotingEnabled && (
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-4 w-4 text-[#9E9E9E]" />
                      <span className="text-sm text-[#9E9E9E]">{response.voteCount || 0}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-[#666666]">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">{formatDate(response.submittedAt)}</span>
                  </div>
                </div>
              </div>
              <div className="text-[#E0E0E0] whitespace-pre-wrap">
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