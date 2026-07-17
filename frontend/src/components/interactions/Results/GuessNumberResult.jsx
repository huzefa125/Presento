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
        // Highlight correct answer using the sticker accent palette
        const isCorrect = i === answer;
        backgroundColors.push(isCorrect ? '#1aae39' : '#62aef0');
        borderColors.push(isCorrect ? '#158a2e' : '#3f8fd6');
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
                backgroundColor: '#ffffff',
                borderColor: '#e6e6e6',
                borderWidth: 1,
                titleColor: '#000000',
                bodyColor: '#000000',
                padding: 12,
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
                    color: '#615d59', // ink-muted for light theme
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
                    <div className="w-full text-center text-ink-faint italic py-12">
                        {t('slide_editors.guess_number.no_guesses_yet')}
                    </div>
                ) : (
                    <div className="w-full bg-canvas-soft rounded-2xl border border-hairline p-6">
                        <div style={{ height: '200px' }}>
                            <Bar data={chartData} options={optionsConfig} />
                        </div>

                        {/* Legend */}
                        <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-hairline">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-accent-sky rounded border-2 border-accent-sky"></div>
                                <span className="text-sm text-ink-secondary">{t('slide_editors.guess_number.incorrect_guesses')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-accent-green rounded border-2 border-accent-green"></div>
                                <span className="text-sm text-ink-secondary">{t('slide_editors.guess_number.correct_answer')}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {answer !== undefined && (
                <div className="mt-8 text-center">
                    <div className="inline-block px-4 py-2 bg-accent-teal/10 rounded-lg border border-accent-teal/30">
                        <span className="text-ink-muted text-sm mr-2">{t('slide_editors.guess_number.correct_answer_label')}:</span>
                        <span className="text-accent-teal font-bold text-lg">{answer}</span>
                    </div>
                </div>
            )}
        </ResultCard>
    );
};

export default GuessNumberResult;