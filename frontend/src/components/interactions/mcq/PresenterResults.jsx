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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Decorative sticker palette — used only for chart category colours, never for structural fills.
const STICKER_FILLS = ['#62aef0', '#d6b6f6', '#ff64c8', '#dd5b00', '#2a9d99', '#1aae39'];
const STICKER_BORDERS = ['#3d8fd6', '#391c57', '#e0499f', '#793400', '#1f7a77', '#128a2c'];

const MCQPresenterResults = ({ options = [], voteCounts = {}, totalResponses = 0 }) => {
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
        label: 'Votes',
        data,
        backgroundColor: STICKER_FILLS,
        borderColor: STICKER_BORDERS,
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
            return `${option}: ${votes} votes (${percentage}%)`;
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
          color: '#615d59',
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
      <div className="bg-surface rounded-lg border border-hairline shadow-[var(--shadow-level-1)] p-4 text-center">
        <p className="text-ink-faint text-sm">No options available for this question</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-lg border border-hairline shadow-[var(--shadow-level-1)] p-4 sm:p-6">
      <div style={{ height: '300px' }}>
        <Bar data={chartData} options={optionsConfig} />
      </div>
    </div>
  );
};

export default MCQPresenterResults;
