import { Bar } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const PickAnswerPresenterResults = ({ options = [], voteCounts = {}, totalResponses = 0 }) => {
  const { t } = useTranslation();
  const labels = options.map(option => typeof option === 'string' ? option : (option?.text || 'Option'));
  // Normalize keys for voteCounts lookup
  const data = options.map(option => {
    const key = typeof option === 'string' ? option : (option?.text || String(option));
    return voteCounts[key] || 0;
  });

  const chartData = {
    labels,
    datasets: [
      {
        label: t('slide_editors.pick_answer.votes_label'),
        data,
        backgroundColor: [
          '#62aef0', // accent-sky
          '#2a9d99', // accent-teal
          '#dd5b00', // accent-orange
          '#391c57', // accent-purple-deep
          '#ff64c8', // accent-pink
          '#1aae39', // accent-green
        ],
        borderColor: [
          '#2f7dd1',
          '#1f7672',
          '#793400',
          '#2a1440',
          '#c94a9c',
          '#12802a',
        ],
        borderWidth: 2,
        borderRadius: 2,
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
        titleColor: '#000000',
        bodyColor: '#31302e',
        callbacks: {
          label: (context) => {
            const option = labels[context.dataIndex];
            const votes = context.parsed.y;
            const percentage = totalResponses > 0 ? Math.round((votes / totalResponses) * 100) : 0;
            return `${option}: ${votes} ${t('slide_editors.pick_answer.votes')} (${percentage}%)`;
          },
        },
      },
    },
    scales: {
      y: {
        display: false,
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#31302e',
          font: {
            size: 12,
            weight: 'bold',
          },
          maxRotation: 30,
          minRotation: 30,
        },
      },
    },
    animation: {
      duration: 300,
    },
  };

  if (!labels.length) {
    return (
      <div className="bg-surface rounded-2xl border border-hairline shadow-[var(--shadow-level-1)] p-4 text-center">
        <p className="text-ink-faint text-sm">{t('slide_editors.pick_answer.no_options_available')}</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-2xl border border-hairline shadow-[var(--shadow-level-1)] p-4 sm:p-6">
      <div style={{ height: '300px' }}>
        <Bar data={chartData} options={optionsConfig} />
      </div>
    </div>
  );
};

export default PickAnswerPresenterResults;
