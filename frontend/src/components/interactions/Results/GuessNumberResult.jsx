import ResultCard from './ResultCard';
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
import { useTranslation } from 'react-i18next';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const GuessNumberResult = ({ slide, data }) => {
    const { t } = useTranslation();
    const distribution = data?.distribution || data?.guessNumberState?.distribution || {};
    const settings = slide?.guessNumberSettings || {};
    const minValue = Number(settings.minValue) || 1;
    const maxValue = Number(settings.maxValue) || 10;
    const answer = Number(settings.correctAnswer) || 5;

    const totalResponses = Object.values(distribution).reduce((a, b) => a + b, 0);

    // Prepare data for all numbers in range
    const labels = [];
    const chartDataPoints = [];
    const backgroundColors = [];
    const borderColors = [];

    for (let i = minValue; i <= maxValue; i++) {
        labels.push(i.toString());
        chartDataPoints.push(distribution[i] || 0);
        // Highlight correct answer in green
        const isCorrect = i === answer;
        backgroundColors.push(isCorrect ? '#10b981' : '#3b82f6');
        borderColors.push(isCorrect ? '#059669' : '#1d4ed8');
    }

    const chartData = {
        labels,
        datasets: [
            {
                label: t('slide_editors.guess_number.guesses'),
                data: chartDataPoints,
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
                backgroundColor: '#1f2937',
                padding: 12,
                titleFont: {
                    size: 14,
                    color: '#fff'
                },
                bodyFont: {
                    size: 13,
                    color: '#fff'
                },
                callbacks: {
                    label: (context) => {
                        const number = labels[context.dataIndex];
                        const guesses = context.parsed.y;
                        const percentage = totalResponses > 0 ? Math.round((guesses / totalResponses) * 100) : 0;
                        const isCorrect = Number(number) === answer;
                        return `${guesses} ${t('slide_editors.guess_number.guess', { count: guesses })} (${percentage}%)${isCorrect ? ` ${t('slide_editors.guess_number.correct')}` : ''}`;
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
                    color: '#94a3b8', // slate-400 for dark theme
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
        <ResultCard slide={slide} totalResponses={totalResponses}>
            <div className="flex flex-col items-center justify-center gap-6 pt-4 pb-4">
                {totalResponses === 0 ? (
                    <div className="w-full text-center text-slate-500 italic py-12">
                        {t('slide_editors.guess_number.no_guesses_yet')}
                    </div>
                ) : (
                    <div className="w-full bg-slate-800/50 rounded-2xl border border-white/10 p-6">
                        <div style={{ height: '200px' }}>
                            <Bar data={chartData} options={optionsConfig} />
                        </div>

                        {/* Legend */}
                        <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-white/10">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-blue-500 rounded border-2 border-blue-700"></div>
                                <span className="text-sm text-slate-300">{t('slide_editors.guess_number.incorrect_guesses')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-green-500 rounded border-2 border-green-700"></div>
                                <span className="text-sm text-slate-300">{t('slide_editors.guess_number.correct_answer')}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {answer !== undefined && (
                <div className="mt-8 text-center">
                    <div className="inline-block px-4 py-2 bg-teal-500/10 rounded-lg border border-teal-500/20">
                        <span className="text-slate-400 text-sm mr-2">{t('slide_editors.guess_number.correct_answer_label')}:</span>
                        <span className="text-teal-400 font-bold text-lg">{answer}</span>
                    </div>
                </div>
            )}
        </ResultCard>
    );
};

export default GuessNumberResult;