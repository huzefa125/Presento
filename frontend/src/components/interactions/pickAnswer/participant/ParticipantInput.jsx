import { Send } from 'lucide-react';

const PickAnswerParticipantInput = ({
  slide,
  selectedAnswer,
  onSelect,
  hasSubmitted,
  voteCounts = {},
  totalResponses = 0,
  onSubmit
}) => {
  if (!slide) return null;

  // Helper to normalize option keys for voteCounts lookup
  const getOptionKey = (option) => {
    return String(option).trim();
  };

  // Helper to get vote count for an option
  const getVoteCount = (option) => {
    const key = getOptionKey(option);
    // Try exact match first
    if (voteCounts.hasOwnProperty(key)) {
      return voteCounts[key];
    }
    // Try to find matching key (case-insensitive, trimmed)
    const matchingKey = Object.keys(voteCounts).find(k => String(k).trim() === key);
    return matchingKey ? voteCounts[matchingKey] : 0;
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-8 sm:mb-12">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#E0E0E0] text-center leading-tight">
          {typeof slide.question === 'string' 
            ? slide.question 
            : (slide.question?.text || slide.question?.label || '')}
        </h2>
      </div>

      {!hasSubmitted ? (
        <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
          {slide.options?.map((option, index) => {
            const optionText = typeof option === 'string' ? option : (option?.text || `Option ${index + 1}`);
            const optionKey = typeof option === 'string' ? option : (option?.id || `option-${index}`);
            return (
              <button
                key={optionKey}
                onClick={() => onSelect(option)}
                aria-label={`Select option: ${optionText}`}
                className={`w-full p-4 sm:p-6 rounded-xl text-left text-base sm:text-xl font-semibold transition-all active:scale-[0.98] ${selectedAnswer === option
                  ? 'bg-gradient-to-r from-[#388E3C] to-[#2E7D32] text-white shadow-lg shadow-[#4CAF50]/30 scale-[1.02]'
                  : 'bg-[#2A2A2A] text-[#E0E0E0] hover:bg-[#333333] border border-[#2F2F2F]'
                  }`}
              >
                {optionText}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-5 mb-6 sm:mb-8">
          {slide.options?.map((option, index) => {
            const optionText = typeof option === 'string' ? option : (option?.text || `Option ${index + 1}`);
            const optionKey = typeof option === 'string' ? option : (option?.id || `option-${index}`);
            const voteCount = getVoteCount(option);
            const maxVotes = Math.max(...Object.values(voteCounts || {}), 1);
            const percentage = maxVotes > 0 ? (voteCount / maxVotes) * 100 : 0;
            const totalPercentage = totalResponses > 0 ? ((voteCount / totalResponses) * 100).toFixed(1) : 0;
            const isSelected = selectedAnswer === option;

            return (
              <div key={optionKey} className="relative group" role="group" aria-label={`${optionText}: ${voteCount} votes (${totalPercentage}%)`}>
                <div className={`relative min-h-[4rem] sm:min-h-[5rem] rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                  isSelected 
                    ? 'border-[#4CAF50] bg-[#1D2A20] shadow-lg shadow-[#4CAF50]/20' 
                    : 'border-[#2F2F2F] bg-[#2A2A2A]'
                }`}>
                  {/* Progress bar background */}
                  <div
                    className={`absolute inset-0 transition-all duration-500 ease-out ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#388E3C]/40 to-[#4CAF50]/40'
                        : 'bg-gradient-to-r from-[#333333]/50 to-[#3A3A3A]/50'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                  
                  {/* Content */}
                  <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center gap-3">
                      <span className={`text-base sm:text-lg font-semibold ${
                        isSelected ? 'text-[#4CAF50]' : 'text-[#E0E0E0]'
                      }`}>
                        {optionText}
                      </span>
                      {isSelected && (
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#4CAF50] text-white text-sm font-bold shadow-lg">
                          ✓
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xl sm:text-2xl font-bold text-[#E0E0E0]">
                          {voteCount}
                        </div>
                        <div className="text-xs sm:text-sm text-[#9E9E9E]">
                          {totalResponses > 0 ? `${totalPercentage}%` : '0%'}
                        </div>
                      </div>
                      {voteCount > 0 && (
                        <div className="hidden sm:block w-16 h-16 rounded-full border-4 border-[#4CAF50]/30 flex items-center justify-center">
                          <div 
                            className="w-full h-full rounded-full bg-gradient-to-br from-[#4CAF50] to-[#388E3C] flex items-center justify-center text-white font-bold text-sm"
                            style={{ 
                              clipPath: `inset(0 ${100 - (totalResponses > 0 ? (voteCount / totalResponses) * 100 : 0)}% 0 0)`
                            }}
                          >
                            {totalResponses > 0 ? Math.round((voteCount / totalResponses) * 100) : 0}%
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Total responses indicator */}
          {totalResponses > 0 && (
            <div className="mt-6 pt-6 border-t border-[#2F2F2F]">
              <div className="flex items-center justify-center gap-2 text-sm text-[#9E9E9E]">
                <div className="w-2 h-2 rounded-full bg-[#4CAF50] animate-pulse"></div>
                <span>Live results updating • {totalResponses} {totalResponses === 1 ? 'response' : 'responses'}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {!hasSubmitted && (
        <button
          onClick={onSubmit}
          disabled={!selectedAnswer}
          className="w-full py-3 sm:py-4 bg-gradient-to-r from-[#388E3C] to-[#2E7D32] hover:from-[#4CAF50] hover:to-[#388E3C] disabled:from-[#1F1F1F] disabled:to-[#1F1F1F] disabled:text-[#6C6C6C] text-white rounded-xl text-lg sm:text-xl font-semibold transition-all active:scale-95 disabled:active:scale-100 flex items-center justify-center gap-2 shadow-lg shadow-[#4CAF50]/20 disabled:shadow-none"
        >
          <Send className="h-5 w-5" />
          Submit Answer
        </button>
      )}

      {hasSubmitted && (
        <div className="text-center py-6">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-[#1D2A20] border border-[#4CAF50]/30">
            <div className="w-2 h-2 rounded-full bg-[#4CAF50] animate-pulse"></div>
            <p className="text-base sm:text-lg text-[#4CAF50] font-semibold">
              ✓ Response submitted! Viewing live results...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PickAnswerParticipantInput;