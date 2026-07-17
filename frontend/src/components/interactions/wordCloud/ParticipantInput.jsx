import { Send, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const MAX_WORD_LENGTH = 20;

const WordCloudParticipantInput = ({
  slide,
  textAnswer,
  onTextChange,
  hasSubmitted,
  onSubmit,
  submissionCount = 0,
  maxSubmissions = 1,
  wordFrequencies = {},
  totalResponses = 0,
}) => {
  const { t } = useTranslation();
  if (!slide) return null;

  const handleInputChange = (value) => {
    if (hasSubmitted) return;
    const firstWord = value.trim().split(/\s+/)[0] || '';
    const limitedWord = firstWord.slice(0, MAX_WORD_LENGTH);
    onTextChange(limitedWord);
  };

  const remainingSubmissions = Math.max(0, maxSubmissions - submissionCount);

  // Sort words by frequency for display
  const sortedWords = useMemo(() => {
    return Object.entries(wordFrequencies || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20); // Show top 20 words
  }, [wordFrequencies]);

  const maxFrequency = useMemo(() => {
    return Math.max(...Object.values(wordFrequencies || {}), 1);
  }, [wordFrequencies]);

  return (
    <div className="w-full max-w-3xl mx-auto px-2 sm:px-4">
      <div className="mb-6 sm:mb-8 md:mb-12">
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-ink text-center leading-tight px-2">
          {typeof slide.question === 'string'
            ? slide.question
            : (slide.question?.text || slide.question?.label || '')}
        </h2>
        {typeof slide.maxWordsPerParticipant === 'number' && !hasSubmitted && (
          <div className="text-center text-ink-muted mt-3 sm:mt-4 text-xs sm:text-sm space-y-1">
            <p>
              {t('slide_editors.word_cloud.enter_words_instruction', {
                count: slide.maxWordsPerParticipant,
                plural: slide.maxWordsPerParticipant > 1 ? 's' : '',
                limit: MAX_WORD_LENGTH
              })}
            </p>
            <p className="font-medium text-primary">
              {t('slide_editors.word_cloud.remaining_submissions', { count: remainingSubmissions })}
            </p>
          </div>
        )}
      </div>

      {!hasSubmitted ? (
        <div className="space-y-4 mb-6 sm:mb-8">
          <input
            type="text"
            value={textAnswer}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={t('slide_editors.word_cloud.word_input_placeholder')}
            maxLength={MAX_WORD_LENGTH}
            disabled={hasSubmitted}
            aria-label={t('slide_editors.word_cloud.word_input_aria_label')}
            aria-describedby="word-cloud-hint"
            className="w-full px-4 py-3 bg-surface border border-[#dddddd] text-ink rounded-xs outline-none placeholder:text-ink-faint transition-shadow duration-150 focus:shadow-[var(--shadow-level-1)] focus:border-primary"
          />
          <p id="word-cloud-hint" className="sr-only">
            {t('slide_editors.word_cloud.word_input_hint', {
              limit: MAX_WORD_LENGTH,
              remaining: remainingSubmissions > 0
                ? t('slide_editors.word_cloud.remaining_submissions_hint', {
                    count: remainingSubmissions,
                    plural: remainingSubmissions > 1 ? 's' : ''
                  })
                : t('slide_editors.word_cloud.no_remaining_submissions')
            })}
          </p>
          <button
            onClick={onSubmit}
            disabled={!textAnswer.trim() || hasSubmitted}
            aria-label={t('slide_editors.word_cloud.submit_word_aria_label')}
            className="w-full py-3 sm:py-4 bg-primary hover:bg-primary-active disabled:bg-canvas-soft disabled:text-ink-faint text-on-primary rounded-full text-lg sm:text-xl font-semibold transition-all active:scale-95 disabled:active:scale-100 flex items-center justify-center gap-2"
          >
            <Send className="h-5 w-5" />
            {t('slide_editors.word_cloud.submit_button')}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Submission confirmation */}
          <div className="bg-surface border border-hairline rounded-xl p-6 text-center shadow-[var(--shadow-level-1)]">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse"></div>
              <p className="text-base sm:text-lg text-accent-green font-semibold">
                {t('slide_editors.word_cloud.word_submitted', { plural: submissionCount > 1 ? 's' : '' })}
              </p>
            </div>
          </div>

          {/* Live Word Cloud */}
          {sortedWords.length > 0 && (
            <div className="bg-surface rounded-2xl border border-hairline shadow-[var(--shadow-level-1)] p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl sm:text-2xl font-semibold text-ink flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  {t('slide_editors.word_cloud.live_word_cloud')}
                </h3>
                {totalResponses > 0 && (
                  <div className="flex items-center gap-2 text-sm text-ink-muted">
                    <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse"></div>
                    <span>{t('slide_editors.word_cloud.response_count', {
                      count: totalResponses,
                      plural: totalResponses === 1 ? '' : 's'
                    })}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3 sm:gap-4 items-center justify-center min-h-[200px] py-4">
                {sortedWords.map(([word, frequency]) => {
                  const percentage = (frequency / maxFrequency) * 100;
                  const fontSize = Math.max(14, Math.min(48, 14 + (percentage / 100) * 34));
                  const opacity = Math.max(0.6, 0.6 + (percentage / 100) * 0.4);

                  return (
                    <div
                      key={word}
                      className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-canvas-soft border border-hairline transition-all hover:scale-105 hover:border-primary/40"
                      style={{
                        fontSize: `${fontSize}px`,
                        opacity: opacity,
                      }}
                    >
                      <span className="font-semibold text-ink">{word}</span>
                      <span className="text-xs sm:text-sm font-bold text-primary bg-surface px-2 py-1 rounded">
                        {frequency}
                      </span>
                    </div>
                  );
                })}
              </div>

              {sortedWords.length === 0 && (
                <div className="text-center py-12 text-ink-faint">
                  <p>{t('slide_editors.word_cloud.no_words_yet')}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WordCloudParticipantInput;
