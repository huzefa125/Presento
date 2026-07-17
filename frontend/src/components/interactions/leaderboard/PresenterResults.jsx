import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Trophy, Medal, Award, Users } from 'lucide-react';
import api from '../../../config/api';

const LeaderboardPresenterResults = ({ 
  slide,
  leaderboard = [],
  slides = []
}) => {
  const { id: presentationId } = useParams();
  const [leaderboardSummary, setLeaderboardSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!presentationId) return;
      
      setIsLoading(true);
      try {
        const response = await api.get(`/presentations/${presentationId}/leaderboard?limit=10`);
        setLeaderboardSummary(response.data || null);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [presentationId, slide?._id, slide?.id]);

  // Determine if this is a quiz-linked leaderboard or final leaderboard
  const linkedQuizSlideId = slide?.leaderboardSettings?.linkedQuizSlideId;
  const linkedQuizSlideIdStr = linkedQuizSlideId ? String(linkedQuizSlideId) : null;
  
  // Find the quiz slide to get its question - handle all ID formats
  const quizSlide = linkedQuizSlideIdStr ? slides.find(s => {
    if (!s || s.type !== 'quiz') return false;
    const slideId1 = s.id;
    const slideId2 = s._id;
    
    // Try both id and _id fields, and handle object IDs
    if (slideId1) {
      if (String(slideId1) === linkedQuizSlideIdStr) return true;
      if (typeof slideId1 === 'object' && slideId1.toString && slideId1.toString() === linkedQuizSlideIdStr) return true;
    }
    if (slideId2) {
      if (String(slideId2) === linkedQuizSlideIdStr) return true;
      if (typeof slideId2 === 'object' && slideId2.toString && slideId2.toString() === linkedQuizSlideIdStr) return true;
    }
    return false;
  }) : null;
  
  const quizQuestion = quizSlide?.question || 'Quiz';

  // Get the appropriate leaderboard data
  let displayLeaderboard = [];
  let leaderboardTitle = 'Final Leaderboard';
  let leaderboardSubtitle = 'Overall standings for this presentation';

  if (linkedQuizSlideIdStr && leaderboardSummary?.perQuizLeaderboards) {
    // Find the per-quiz leaderboard entry - handle all ID formats
    const perQuizEntry = leaderboardSummary.perQuizLeaderboards.find(
      (entry) => {
        if (!entry.quizSlideId) return false;
        const entryIdStr = String(entry.quizSlideId);
        return entryIdStr === linkedQuizSlideIdStr;
      }
    );
    
    if (perQuizEntry) {
      displayLeaderboard = perQuizEntry.leaderboard || [];
      leaderboardTitle = `${quizQuestion} leaderboard results`;
      leaderboardSubtitle = `Results for: ${quizQuestion}`;
    } else {
      // Fallback to final leaderboard if per-quiz entry not found
      displayLeaderboard = leaderboardSummary?.finalLeaderboard || [];
    }
  } else {
    // Final leaderboard (no linked quiz)
    displayLeaderboard = leaderboardSummary?.finalLeaderboard || [];
  }
  const getMedalIcon = (rank) => {
    if (rank === 0) return <Trophy className="h-8 w-8 text-amber-400" />;
    if (rank === 1) return <Medal className="h-8 w-8 text-[#B0B0B0]" />;
    if (rank === 2) return <Award className="h-8 w-8 text-orange-400" />;
    return null;
  };

  const getRankColor = (rank) => {
    if (rank === 0) return 'from-amber-400 to-yellow-500';
    if (rank === 1) return 'from-[#E0E0E0] to-[#B0B0B0]';
    if (rank === 2) return 'from-orange-400 to-orange-500';
    return 'from-blue-400 to-indigo-500';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-[#1F1F1F] rounded-xl border border-[#2A2A2A] shadow-lg p-4 sm:p-6 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#2A2520] border border-[#FFD700]/30 rounded-lg">
              <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-[#FFD700]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#E0E0E0]">
                {leaderboardTitle}
              </h2>
              <p className="text-xs sm:text-sm text-[#6C6C6C]">
                {leaderboardSubtitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[#B0B0B0]">
            <Users className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-base sm:text-lg font-semibold text-[#E0E0E0]">{displayLeaderboard.length}</span>
            <span className="text-sm">participants</span>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="flex-1 bg-[#1F1F1F] rounded-xl border border-[#2A2A2A] shadow-lg overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-[#388E3C] to-[#2E7D32] p-3 sm:p-4">
          <h3 className="text-lg sm:text-xl font-bold text-white text-center">
            Top Performers
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-[#6C6C6C]">
              <p className="text-lg sm:text-xl">Loading leaderboard...</p>
            </div>
          ) : displayLeaderboard.length > 0 ? (
            <div className="space-y-3">
              {displayLeaderboard.map((participant, index) => (
                <div
                  key={participant.participantId}
                  className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border-2 transition-all ${
                    index === 0 ? 'bg-[#2A2520] border-[#FFD700]/30 shadow-md' :
                    index === 1 ? 'bg-[#252525] border-[#C0C0C0]/30' :
                    index === 2 ? 'bg-[#252020] border-[#CD7F32]/30' :
                    'bg-[#1F1F1F] border-[#2A2A2A] hover:border-[#333333]'
                  }`}
                >
                  {/* Rank Badge */}
                  <div className="flex-shrink-0">
                    {index < 3 ? (
                      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br ${getRankColor(index)} flex items-center justify-center shadow-lg`}>
                        <span className="text-white font-bold text-lg sm:text-xl">{index + 1}</span>
                      </div>
                    ) : (
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#2A2A2A] flex items-center justify-center">
                        <span className="text-[#E0E0E0] font-bold text-lg sm:text-xl">{index + 1}</span>
                      </div>
                    )}
                  </div>

                  {/* Medal Icon */}
                  {index < 3 && (
                    <div className="flex-shrink-0">
                      {getMedalIcon(index)}
                    </div>
                  )}

                  {/* Participant Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-lg sm:text-xl font-bold text-[#E0E0E0] truncate">
                      {participant.participantName}
                    </div>
                    <div className="text-xs sm:text-sm text-[#6C6C6C]">
                      {participant.quizCount} quiz{participant.quizCount !== 1 ? 'zes' : ''} completed
                    </div>
                  </div>

                  {/* Score */}
                  <div className="flex-shrink-0 text-right">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-[#FFD700]" />
                      <span className="text-2xl sm:text-3xl font-bold text-[#4CAF50]">
                        {participant.totalScore}
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm text-[#6C6C6C] mt-1">
                      points
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-[#6C6C6C]">
              <Trophy className="h-20 w-20 sm:h-24 sm:w-24 mb-4 opacity-50" />
              <p className="text-lg sm:text-xl font-semibold mb-2">No Participants Yet</p>
              <p className="text-xs sm:text-sm">Participants will appear here after completing quizzes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPresenterResults;
