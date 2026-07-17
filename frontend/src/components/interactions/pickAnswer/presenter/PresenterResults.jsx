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
          '#3b82f6',
          '#10b981',
          '#eab308',
          '#a855f7',
          '#ec4899',
          '#ef4444',
        ],
        borderColor: [
          '#1d4ed8',
          '#059669',
          '#ca8a04',
          '#7c3aed',
          '#be185d',
          '#dc2626',
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
        backgroundColor: '#1F1F1F',
        borderColor: '#2A2A2A',
        borderWidth: 1,
        titleColor: '#E0E0E0',
        bodyColor: '#E0E0E0',
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
          color: '#E0E0E0',
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
      <div className="bg-[#1F1F1F] rounded-2xl border border-[#2A2A2A] shadow-lg p-4 text-center">
        <p className="text-[#6C6C6C] text-sm">{t('slide_editors.pick_answer.no_options_available')}</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1F1F1F] rounded-2xl border border-[#2A2A2A] p-4 sm:p-6">
      <div style={{ height: '300px' }}>
        <Bar data={chartData} options={optionsConfig} />
      </div>
    </div>
  );
};

export default PickAnswerPresenterResults;