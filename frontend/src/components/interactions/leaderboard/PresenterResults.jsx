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
    if (rank === 0) return <Trophy className="h-8 w-8 text-accent-orange" />;
    if (rank === 1) return <Medal className="h-8 w-8 text-accent-sky" />;
    if (rank === 2) return <Award className="h-8 w-8 text-accent-brown" />;
    return null;
  };

  const getRankColor = (rank) => {
    if (rank === 0) return 'bg-accent-orange';
    if (rank === 1) return 'bg-accent-sky';
    if (rank === 2) return 'bg-accent-brown';
    return 'bg-primary';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-surface rounded-xl border border-hairline shadow-[var(--shadow-level-1)] p-4 sm:p-6 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-accent-orange/10 border border-accent-orange/30 rounded-lg">
              <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-accent-orange" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-ink">
                {leaderboardTitle}
              </h2>
              <p className="text-xs sm:text-sm text-ink-muted">
                {leaderboardSubtitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-ink-muted">
            <Users className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-base sm:text-lg font-semibold text-ink">{displayLeaderboard.length}</span>
            <span className="text-sm">participants</span>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="flex-1 bg-surface rounded-xl border border-hairline shadow-[var(--shadow-level-1)] overflow-hidden flex flex-col">
        <div className="bg-accent-green/10 border-b border-hairline p-3 sm:p-4">
          <h3 className="text-lg sm:text-xl font-bold text-accent-green text-center">
            Top Performers
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-ink-faint">
              <p className="text-lg sm:text-xl">Loading leaderboard...</p>
            </div>
          ) : displayLeaderboard.length > 0 ? (
            <div className="space-y-3">
              {displayLeaderboard.map((participant, index) => (
                <div
                  key={participant.participantId}
                  className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border transition-all ${
                    index === 0 ? 'bg-accent-orange/10 border-accent-orange/30 shadow-[var(--shadow-level-1)]' :
                    index === 1 ? 'bg-accent-sky/10 border-accent-sky/30' :
                    index === 2 ? 'bg-accent-brown/10 border-accent-brown/30' :
                    'bg-surface border-hairline hover:border-ink-faint'
                  }`}
                >
                  {/* Rank Badge */}
                  <div className="flex-shrink-0">
                    {index < 3 ? (
                      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full ${getRankColor(index)} flex items-center justify-center shadow-[var(--shadow-level-1)]`}>
                        <span className="text-on-primary font-bold text-lg sm:text-xl">{index + 1}</span>
                      </div>
                    ) : (
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-canvas-soft flex items-center justify-center">
                        <span className="text-ink font-bold text-lg sm:text-xl">{index + 1}</span>
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
                    <div className="text-lg sm:text-xl font-bold text-ink truncate">
                      {participant.participantName}
                    </div>
                    <div className="text-xs sm:text-sm text-ink-muted">
                      {participant.quizCount} quiz{participant.quizCount !== 1 ? 'zes' : ''} completed
                    </div>
                  </div>

                  {/* Score */}
                  <div className="flex-shrink-0 text-right">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-accent-orange" />
                      <span className="text-2xl sm:text-3xl font-bold text-accent-green">
                        {participant.totalScore}
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm text-ink-muted mt-1">
                      points
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-ink-faint">
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
