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
import { RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const PresenterGuessView = ({ slide, distribution = {}, correctAnswer, onClearResponses }) => {
  const { t } = useTranslation();
  
  // Safely extract settings with proper fallbacks
  const settings = slide?.guessNumberSettings || {};
  const minValue = Number(settings.minValue) || 1;
  const maxValue = Number(settings.maxValue) || 10;
  const answer = Number(correctAnswer ?? settings.correctAnswer) || 5;

  // Debug logging
  console.log('PresenterGuessView - slide:', slide);
  console.log('PresenterGuessView - guessNumberSettings:', settings);
  console.log('PresenterGuessView - minValue:', minValue, 'maxValue:', maxValue, 'answer:', answer);
  console.log('PresenterGuessView - distribution:', distribution);

  // Prepare data for all numbers in range
  const labels = [];
  const data = [];
  const backgroundColors = [];
  const borderColors = [];

  for (let i = minValue; i <= maxValue; i++) {
    labels.push(i.toString());
    data.push(distribution[i] || 0);
    // Highlight correct answer using the decorative sticker green; other bars use the single structural blue
    const isCorrect = i === answer;
    backgroundColors.push(isCorrect ? '#1aae39' : '#0075de');
    borderColors.push(isCorrect ? '#128a2e' : '#005bab');
  }

  const totalGuesses = Object.values(distribution).reduce((sum, count) => sum + count, 0);

  const chartData = {
    labels,
    datasets: [
      {
        label: t('slide_editors.guess_number.responses_label') || 'Guesses',
        data,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 2,
        borderRadius: 3,
        borderSkipped: false,
      },
    ],
  };

  const optionsConfig = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#ffffff',
        borderColor: '#e6e6e6',
        borderWidth: 1,
        padding: 12,
        titleColor: '#000000',
        bodyColor: '#31302e',
        titleFont: {
          size: 14,
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          label: (context) => {
            const number = labels[context.dataIndex];
            const guesses = context.parsed.y;
            const percentage = totalGuesses > 0 ? Math.round((guesses / totalGuesses) * 100) : 0;
            const isCorrect = Number(number) === answer;
            return `${guesses} ${guesses !== 1 ? t('slide_editors.guess_number.guesses_plural') || 'guesses' : t('slide_editors.guess_number.guess_singular') || 'guess'} (${percentage}%)${isCorrect ? ' ✓ ' + (t('slide_editors.guess_number.correct') || 'Correct!') : ''}`;
          },
        },
      },
    },
    scales: {
      y: {
        display:false,
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#000000',
          font: {
            size: 14,
            weight: 'bold',
          },
        },
      },
    },
    animation: {
      duration: 300,
    },
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Question Info */}
      <div className="bg-surface rounded-2xl shadow-[var(--shadow-level-1)] border border-hairline p-4 sm:p-6">
        <h2 className="text-2xl sm:text-3xl font-semibold text-ink mb-4">
          {slide?.question || t('slide_editors.guess_number.default_title') || 'Guess the Number'}
        </h2>
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-ink-faint font-semibold">{t('slide_editors.guess_number.range_label') || 'Range:'}</span>
            <span className="font-semibold text-ink">{minValue} - {maxValue}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-ink-faint font-semibold">{t('slide_editors.guess_number.correct_label') || 'Correct:'}</span>
            <span className="font-semibold text-accent-green">{answer}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-ink-faint font-semibold">{t('slide_editors.guess_number.total_guesses') || 'Total Guesses:'}</span>
            <span className="font-semibold text-ink">{totalGuesses}</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-surface rounded-2xl shadow-[var(--shadow-level-1)] border border-hairline p-4 sm:p-6">
        <div className="flex justify-end mb-4">
          <button
            onClick={onClearResponses}
            className="flex items-center gap-2 px-4 py-2 bg-canvas-soft hover:bg-hairline text-ink-secondary border border-hairline rounded-md transition-all active:scale-95 text-sm font-medium"
          >
            <RotateCcw className="h-4 w-4" />
            {t('slide_editors.guess_number.reset_responses') || 'Reset Responses'}
          </button>
        </div>
        <div style={{ height: '350px' }}>
          <Bar data={chartData} options={optionsConfig} />
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-6 sm:mt-7 pt-4 border-t border-hairline">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-primary rounded border-2 border-primary-active"></div>
            <span className="text-sm text-ink-muted">{t('slide_editors.guess_number.incorrect_guesses') || 'Incorrect Guesses'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-accent-green rounded border-2 border-accent-green"></div>
            <span className="text-sm text-ink-muted">{t('slide_editors.guess_number.correct_answer') || 'Correct Answer'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PresenterGuessView;