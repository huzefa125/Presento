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
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-[#E0E0E0] text-center leading-tight px-2">
          {typeof slide.question === 'string' 
            ? slide.question 
            : (slide.question?.text || slide.question?.label || '')}
        </h2>
        {typeof slide.maxWordsPerParticipant === 'number' && !hasSubmitted && (
          <div className="text-center text-[#B0B0B0] mt-3 sm:mt-4 text-xs sm:text-sm space-y-1">
            <p>
              {t('slide_editors.word_cloud.enter_words_instruction', { 
                count: slide.maxWordsPerParticipant, 
                plural: slide.maxWordsPerParticipant > 1 ? 's' : '',
                limit: MAX_WORD_LENGTH
              })}
            </p>
            <p className="font-medium text-[#4CAF50]">
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
            className="w-full px-4 py-3 bg-[#2A2A2A] border border-[#2F2F2F] text-[#E0E0E0] rounded-lg focus:ring-2 focus:ring-[#4CAF50] focus:border-[#4CAF50] outline-none placeholder-[#6C6C6C] transition-all"
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
            className="w-full py-3 sm:py-4 bg-gradient-to-r from-[#388E3C] to-[#2E7D32] hover:from-[#4CAF50] hover:to-[#388E3C] disabled:from-[#1F1F1F] disabled:to-[#1F1F1F] disabled:text-[#6C6C6C] text-white rounded-xl text-lg sm:text-xl font-semibold transition-all active:scale-95 disabled:active:scale-100 flex items-center justify-center gap-2 shadow-lg shadow-[#4CAF50]/20 disabled:shadow-none"
          >
            <Send className="h-5 w-5" />
            {t('slide_editors.word_cloud.submit_button')}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Submission confirmation */}
          <div className="bg-[#1D2A20] border border-[#4CAF50]/30 rounded-xl p-6 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-[#4CAF50] animate-pulse"></div>
              <p className="text-base sm:text-lg text-[#4CAF50] font-semibold">
                {t('slide_editors.word_cloud.word_submitted', { plural: submissionCount > 1 ? 's' : '' })}
              </p>
            </div>
          </div>

          {/* Live Word Cloud */}
          {sortedWords.length > 0 && (
            <div className="bg-[#1F1F1F] rounded-2xl border border-[#2A2A2A] shadow-xl p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl sm:text-2xl font-semibold text-[#E0E0E0] flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-[#4CAF50]" />
                  {t('slide_editors.word_cloud.live_word_cloud')}
                </h3>
                {totalResponses > 0 && (
                  <div className="flex items-center gap-2 text-sm text-[#9E9E9E]">
                    <div className="w-2 h-2 rounded-full bg-[#4CAF50] animate-pulse"></div>
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
                      className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-[#2A2A2A] border border-[#2F2F2F] transition-all hover:scale-105 hover:border-[#4CAF50]/50"
                      style={{
                        fontSize: `${fontSize}px`,
                        opacity: opacity,
                      }}
                    >
                      <span className="font-semibold text-[#E0E0E0]">{word}</span>
                      <span className="text-xs sm:text-sm font-bold text-[#4CAF50] bg-[#1D2A20] px-2 py-1 rounded">
                        {frequency}
                      </span>
                    </div>
                  );
                })}
              </div>

              {sortedWords.length === 0 && (
                <div className="text-center py-12 text-[#6C6C6C]">
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
