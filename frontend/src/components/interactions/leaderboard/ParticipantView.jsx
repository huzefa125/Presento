import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Trophy, TrendingUp, Medal, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../../config/api';

const LeaderboardParticipantView = ({ 
  slide,
  leaderboard = [],
  participantId 
}) => {
  const { id: presentationId } = useParams();
  const [fetchedLeaderboard, setFetchedLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch leaderboard data if not provided or if it's a virtual final leaderboard
  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!presentationId) return;
      
      // Check if this is a virtual final leaderboard or if leaderboard prop is empty
      const isVirtualFinal = slide?.id === 'virtual-final-leaderboard' || 
                             slide?._id === 'virtual-final-leaderboard' ||
                             slide?.leaderboardSettings?.isFinalLeaderboard;
      
      if (isVirtualFinal || leaderboard.length === 0) {
        setIsLoading(true);
        try {
          const response = await api.get(`/presentations/${presentationId}/leaderboard?limit=10`);
          // API response structure: { success: true, finalLeaderboard: [...], perQuizLeaderboards: [...] }
          const finalLeaderboard = response.data?.finalLeaderboard || [];
          setFetchedLeaderboard(finalLeaderboard);
        } catch (error) {
          console.error('Failed to fetch leaderboard:', error);
          setFetchedLeaderboard([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        // Use provided leaderboard
        setFetchedLeaderboard(leaderboard);
      }
    };

    fetchLeaderboard();
  }, [presentationId, slide?.id, slide?._id, slide?.leaderboardSettings?.isFinalLeaderboard, leaderboard]);

  // Use fetched leaderboard if available, otherwise use prop
  const displayLeaderboard = fetchedLeaderboard.length > 0 ? fetchedLeaderboard : leaderboard;
  const myRank = displayLeaderboard.findIndex(p => p.participantId === participantId);
  const myData = myRank !== -1 ? displayLeaderboard[myRank] : null;

  const getMedalIcon = (rank) => {
    if (rank === 0) return <Trophy className="h-6 w-6 text-amber-400" />;
    if (rank === 1) return <Medal className="h-6 w-6 text-[#B0B0B0]" />;
    if (rank === 2) return <Award className="h-6 w-6 text-orange-400" />;
    return null;
  };

  const getRankColor = (rank) => {
    if (rank === 0) return 'from-amber-400 to-yellow-500';
    if (rank === 1) return 'from-[#E0E0E0] to-[#B0B0B0]';
    if (rank === 2) return 'from-orange-400 to-orange-500';
    return 'from-blue-400 to-indigo-500';
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Title */}
      <div className="mb-8 text-center">
        <h2 className="text-4xl font-bold text-[#E0E0E0] mb-2">
          {slide?.question || 'Leaderboard'}
        </h2>
        <p className="text-[#B0B0B0]">
          Top performers in this presentation
        </p>
      </div>

      {/* My Position Card */}
      {myData && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-8 bg-gradient-to-r from-[#388E3C] to-[#2E7D32] rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Your Position</p>
              <div className="flex items-center gap-3">
                <span className="text-5xl font-bold">#{myRank + 1}</span>
                {myData.delta > 0 && (
                  <div className="flex items-center gap-1 text-green-300">
                    <TrendingUp className="h-5 w-5" />
                    <span className="text-lg font-semibold">+{myData.delta}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90 mb-1">Total Score</p>
              <div className="flex items-center gap-2">
                <Trophy className="h-6 w-6" />
                <span className="text-4xl font-bold">{myData.totalScore}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Leaderboard */}
      <div className="bg-[#1F1F1F] rounded-2xl shadow-xl overflow-hidden border border-[#2A2A2A]">
        <div className="bg-gradient-to-r from-[#388E3C] to-[#2E7D32] p-4">
          <div className="flex items-center justify-center gap-2 text-white">
            <Trophy className="h-6 w-6" />
            <h3 className="text-xl font-bold">Top 10 Leaderboard</h3>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {isLoading ? (
            <div className="p-12 text-center text-[#6C6C6C]">
              <p className="text-lg">Loading leaderboard...</p>
            </div>
          ) : displayLeaderboard.length > 0 ? (
            displayLeaderboard.map((participant, index) => {
              const isMe = participant.participantId === participantId;
              
              return (
                <motion.div
                  key={participant.participantId}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 flex items-center gap-4 ${
                    isMe ? 'bg-[#1D2A20]' : 'hover:bg-[#2A2A2A]'
                  } transition-colors`}
                >
                  {/* Rank */}
                  <div className="flex-shrink-0">
                    {index < 3 ? (
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getRankColor(index)} flex items-center justify-center shadow-lg`}>
                        <span className="text-white font-bold text-lg">{index + 1}</span>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#2A2A2A] flex items-center justify-center">
                        <span className="text-[#E0E0E0] font-bold text-lg">{index + 1}</span>
                      </div>
                    )}
                  </div>

                  {/* Medal Icon */}
                  {index < 3 && (
                    <div className="flex-shrink-0">
                      {getMedalIcon(index)}
                    </div>
                  )}

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <div className={`text-lg font-semibold truncate ${
                      isMe ? 'text-[#4CAF50]' : 'text-[#E0E0E0]'
                    }`}>
                      {participant.participantName}
                      {isMe && <span className="ml-2 text-sm">(You)</span>}
                    </div>
                    <div className="text-sm text-[#B0B0B0]">
                      {participant.quizCount} quiz{participant.quizCount !== 1 ? 'zes' : ''} completed
                    </div>
                  </div>

                  {/* Score */}
                  <div className="flex-shrink-0 text-right">
                    <div className="text-2xl font-bold text-[#E0E0E0]">
                      {participant.totalScore}
                    </div>
                    {participant.delta > 0 && (
                      <div className="flex items-center justify-end gap-1 text-[#4CAF50] text-sm font-medium">
                        <TrendingUp className="h-4 w-4" />
                        +{participant.delta}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="p-12 text-center text-[#6C6C6C]">
              <Trophy className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No participants yet</p>
              <p className="text-sm">Complete quizzes to appear on the leaderboard</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Message */}
      {!myData && displayLeaderboard.length > 0 && (
        <div className="mt-6 text-center text-[#B0B0B0]">
          <p>Keep answering quizzes to climb the leaderboard! 🚀</p>
        </div>
      )}
    </div>
  );
};

export default LeaderboardParticipantView;
