import { useState, useEffect, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Clock, CheckCircle, XCircle, Users, Play, StopCircle } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const QuizPresenterResults = ({ 
  slide,
  quizState = {},
  onStartQuiz,
  onEndQuiz
}) => {
  const [timeRemaining, setTimeRemaining] = useState(null);
  const quizSettings = slide?.quizSettings || {};
  // eslint-disable-next-line
  const options = quizSettings.options || [];
  const question = slide?.question || '';
  const correctOptionId = quizSettings.correctOptionId;
  const timeLimit = quizSettings.timeLimit || 30;
  
  const isActive = quizState.isActive || false;
  const startTime = quizState.startTime;
  const results = quizState.results || {
    totalResponses: 0,
    optionCounts: {},
    correctCount: 0,
    incorrectCount: 0,
    averageResponseTime: 0
  };

  // Countdown timer
  useEffect(() => {
    if (!isActive || !startTime) {
      setTimeRemaining(null);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, timeLimit - elapsed);
      setTimeRemaining(remaining);

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isActive, startTime, timeLimit]);

  // Prepare chart data - memoized to prevent infinite re-renders
  const chartData = useMemo(() => {
    const labels = options.map(opt => opt.text);
    const data = options.map(opt => results.optionCounts[opt.id] || 0);
    const backgroundColors = options.map(opt => 
      opt.id === correctOptionId ? '#10b981' : '#3b82f6'
    );
    const borderColors = options.map(opt => 
      opt.id === correctOptionId ? '#059669' : '#1d4ed8'
    );

    return {
      labels,
      datasets: [
        {
          label: 'Responses',
          data,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 2,
          borderRadius: 4,
          borderSkipped: false,
        },
      ],
    };
  }, [options, results.optionCounts, correctOptionId]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1F1F1F',
        borderColor: '#2A2A2A',
        borderWidth: 1,
        titleColor: '#E0E0E0',
        bodyColor: '#E0E0E0',
        callbacks: {
          label: (context) => {
            const option = options[context.dataIndex];
            const count = context.parsed.y;
            const percentage = results.totalResponses > 0 
              ? Math.round((count / results.totalResponses) * 100) 
              : 0;
            const isCorrect = option.id === correctOptionId;
            return `${count} responses (${percentage}%) ${isCorrect ? '✓ Correct' : ''}`;
          },
        },
      },
    },
    scales: {
      y: {
        display: false
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#E0E0E0',
          font: {
            size: 12,
            weight: 'bold',
          },
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
    animation: {
      duration: 300,
    },
  }), [options, results.totalResponses, correctOptionId]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4 lg:gap-6">
      {/* Left Column - Question and Controls */}
      <div className="flex-1 lg:flex-[0.5] flex flex-col gap-4">
        <div className="bg-[#1F1F1F] rounded-xl border border-[#2A2A2A] shadow-lg p-4 sm:p-6 flex flex-col gap-4 h-full">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#E0E0E0] leading-tight">
            {question}
          </h2>
          
          {/* Stats */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-[#6C6C6C]" />
              <span className="font-medium text-[#E0E0E0] text-base sm:text-lg">{results.totalResponses}</span>
              <span className="text-[#6C6C6C]">responses</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-[#4CAF50]" />
              <span className="font-medium text-[#4CAF50] text-base sm:text-lg">{results.correctCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-[#EF5350]" />
              <span className="font-medium text-[#EF5350] text-base sm:text-lg">{results.incorrectCount}</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-3 mt-auto">
            <div className="flex flex-wrap items-center gap-3">
              {!isActive ? (
                <button
                  onClick={onStartQuiz}
                  className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-[#388E3C] to-[#2E7D32] hover:from-[#4CAF50] hover:to-[#388E3C] text-white rounded-lg font-medium transition-all active:scale-95 shadow-lg shadow-[#4CAF50]/20"
                >
                  <Play className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-sm sm:text-base">Start Quiz</span>
                </button>
              ) : (
                <button
                  onClick={onEndQuiz}
                  className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-[#EF5350] hover:bg-[#E53935] text-white rounded-lg font-medium transition-all active:scale-95 shadow-lg shadow-red-500/20"
                >
                  <StopCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-sm sm:text-base">End Quiz</span>
                </button>
              )}

              {isActive && timeRemaining !== null && (
                <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold ${
                  timeRemaining <= 5 ? 'bg-[#2A1F1F] border border-[#EF5350]/30 text-[#EF5350]' : 'bg-[#1D2A20] border border-[#4CAF50]/30 text-[#4CAF50]'
                }`}>
                  <Clock className="h-5 w-5" />
                  <span className="text-lg">{formatTime(timeRemaining)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Chart */}
      <div className="flex-1 lg:flex-[0.5] flex flex-col gap-4">
        {/* Chart */}
        <div className="bg-[#1F1F1F] rounded-xl border border-[#2A2A2A] shadow-lg p-4 sm:p-6 flex-1 min-h-0 flex flex-col">
          <h3 className="text-base sm:text-lg font-semibold text-[#E0E0E0] mb-4">Response</h3>
          <div className="flex flex-1 min-h-0">
            {options.length > 0 ? (
              <Bar data={chartData} options={chartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-[#6C6C6C]">
                No options available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
;

export default QuizPresenterResults;
