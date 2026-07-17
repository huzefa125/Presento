import { useMemo, useState, useEffect } from 'react';
import ResultCard from './ResultCard';
import { useTranslation } from 'react-i18next';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Scatter } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const COLORS = [
    '#62aef0', // accent-sky
    '#ff64c8', // accent-pink
    '#391c57', // accent-purple-deep
    '#2a9d99', // accent-teal
    '#dd5b00', // accent-orange
    '#1aae39', // accent-green
];

const GridResult = ({ slide, data }) => {
    const { t } = useTranslation();
    const [isMobile, setIsMobile] = useState(false);
    
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);
    
    // eslint-disable-next-line
    const results = data?.gridResults || [];
    const totalResponses = data.totalResponses || 0;

    const axisXLabel = slide.gridAxisXLabel || 'Horizontal';
    const axisYLabel = slide.gridAxisYLabel || 'Vertical';
    const min = slide.gridAxisRange?.min ?? 0;
    const max = slide.gridAxisRange?.max ?? 10;

    const chartData = useMemo(() => {
        const gridItems = slide.gridItems || [];
        const itemData = {};

        // Initialize with 0 counts
        gridItems.forEach(item => {
            itemData[item.id] = {
                ...item,
                sumX: 0,
                sumY: 0,
                count: 0
            };
        });

        // Sum up responses
        results.forEach(res => {
            if (itemData[res.itemId]) {
                itemData[res.itemId].sumX += res.x;
                itemData[res.itemId].sumY += res.y;
                itemData[res.itemId].count++;
            }
        });

        // Calculate averages and format for chart
        const datasets = Object.values(itemData).map((item, index) => {
            const averageX = item.count > 0 ? Math.round((item.sumX / item.count) * 10) / 10 : 0;
            const averageY = item.count > 0 ? Math.round((item.sumY / item.count) * 10) / 10 : 0;

            if (item.count === 0) {
                return {
                    label: item.label,
                    data: [],
                    backgroundColor: COLORS[index % COLORS.length],
                    borderColor: COLORS[index % COLORS.length],
                    pointRadius: isMobile ? 6 : 10,
                    pointHoverRadius: isMobile ? 8 : 12,
                };
            }

            return {
                label: item.label,
                data: [{ x: averageX, y: averageY }],
                backgroundColor: COLORS[index % COLORS.length],
                borderColor: COLORS[index % COLORS.length],
                pointRadius: isMobile ? 6 : 10,
                pointHoverRadius: isMobile ? 8 : 12,
            };
        });

        return { datasets };
    }, [slide.gridItems, results, isMobile]);

    const options = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                type: 'linear',
                position: 'bottom',
                min: min,
                max: max,
                title: {
                    display: true,
                    text: axisXLabel,
                    color: '#615d59',
                    font: { size: isMobile ? 12 : 16, weight: 'bold' }
                },
                grid: {
                    display: true,
                    drawBorder: true,
                    color: (context) => {
                        const midValue = (min + max) / 2;
                        return context.tick.value === midValue ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.08)';
                    },
                    lineWidth: (context) => {
                        const midValue = (min + max) / 2;
                        return context.tick.value === midValue ? 2 : 1;
                    }
                },
                ticks: {
                    color: '#615d59',
                    font: {
                        size: isMobile ? 10 : 12
                    }
                }
            },
            y: {
                type: 'linear',
                min: min,
                max: max,
                title: {
                    display: true,
                    text: axisYLabel,
                    color: '#615d59',
                    font: { size: isMobile ? 12 : 16, weight: 'bold' }
                },
                grid: {
                    display: true,
                    drawBorder: true,
                    color: (context) => {
                        const midValue = (min + max) / 2;
                        return context.tick.value === midValue ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.08)';
                    },
                    lineWidth: (context) => {
                        const midValue = (min + max) / 2;
                        return context.tick.value === midValue ? 2 : 1;
                    }
                },
                ticks: {
                    color: '#615d59',
                    font: {
                        size: isMobile ? 10 : 12
                    }
                }
            }
        },
        plugins: {
            legend: {
                display: true,
                position: isMobile ? 'bottom' : 'right',
                labels: {
                    color: '#31302e',
                    usePointStyle: true,
                    padding: isMobile ? 10 : 15,
                    font: { size: isMobile ? 10 : 12 },
                    boxWidth: isMobile ? 10 : 12,
                    boxHeight: isMobile ? 10 : 12
                }
            },
            tooltip: {
                backgroundColor: '#ffffff',
                borderColor: '#e6e6e6',
                borderWidth: 1,
                titleColor: '#000000',
                bodyColor: '#000000',
                titleFont: {
                    size: isMobile ? 11 : 13
                },
                bodyFont: {
                    size: isMobile ? 10 : 12
                },
                callbacks: {
                    label: (context) => {
                        return `${context.dataset.label}: (${context.parsed.x}, ${context.parsed.y})`;
                    }
                }
            }
        },
        animation: {
            duration: 750,
            easing: 'easeInOutQuart'
        }
    }), [min, max, axisXLabel, axisYLabel, isMobile]);

    // Calculate averages for the list view
    const itemAverages = useMemo(() => {
        const gridItems = slide.gridItems || [];
        const itemData = {};

        // Initialize
        gridItems.forEach(item => {
            itemData[item.id] = {
                ...item,
                sumX: 0,
                sumY: 0,
                count: 0
            };
        });

        // Sum up
        results.forEach(res => {
            if (itemData[res.itemId]) {
                itemData[res.itemId].sumX += res.x;
                itemData[res.itemId].sumY += res.y;
                itemData[res.itemId].count++;
            }
        });

        // Calculate averages
        return Object.values(itemData).map(item => ({
            ...item,
            averageX: item.count > 0 ? Math.round((item.sumX / item.count) * 10) / 10 : 0,
            averageY: item.count > 0 ? Math.round((item.sumY / item.count) * 10) / 10 : 0
        }));
    }, [slide.gridItems, results]);

    return (
        <ResultCard slide={slide} totalResponses={totalResponses}>
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-5 md:gap-6 items-start">
                {/* Left: Scatter Graph */}
                <div className="w-full lg:w-[400px] lg:flex-[1.3] bg-canvas-soft rounded-lg sm:rounded-xl border border-hairline p-2 sm:p-3 md:p-4 overflow-hidden" style={{ height: isMobile ? '280px' : 'clamp(350px, 50vh, 400px)', minHeight: isMobile ? '280px' : '350px' }}>
                    <Scatter data={chartData} options={options} />
                </div>

                {/* Right: Items List */}
                <div className="w-full lg:flex-1 space-y-3 sm:space-y-4 min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-ink-muted uppercase tracking-wider mb-2 sm:mb-3">
                        {t('presentation_results.common_labels.items_overview')}
                    </h3>
                    <div className="space-y-2 sm:space-y-3">
                        {itemAverages.length === 0 ? (
                            <div className="text-center text-xs sm:text-sm text-ink-faint py-6 sm:py-8 bg-canvas-soft rounded-lg border border-hairline">
                                {t('presentation_results.common_labels.no_items_configured')}
                            </div>
                        ) : (
                            itemAverages.map((item, index) => (
                                <div key={item.id} className="bg-surface rounded-lg p-3 sm:p-4 border border-hairline hover:bg-canvas-soft transition-colors">
                                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                                        <div
                                            className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                        />
                                        <span className="text-sm sm:text-base font-medium text-ink break-words flex-1 min-w-0">
                                            {typeof item.label === 'string'
                                                ? item.label
                                                : (item.text || item.label?.text || item.label?.label || '')}
                                        </span>
                                    </div>
                                    <div className="text-xs sm:text-sm text-ink-muted ml-5 sm:ml-6 flex flex-col gap-1">
                                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                            <span className="px-1.5 sm:px-2 py-0.5 bg-canvas-soft rounded text-xs font-mono text-ink-secondary whitespace-nowrap">
                                                {axisXLabel}: {item.count > 0 ? item.averageX : '-'}
                                            </span>
                                            <span className="text-ink-faint">/</span>
                                            <span className="px-1.5 sm:px-2 py-0.5 bg-canvas-soft rounded text-xs font-mono text-ink-secondary whitespace-nowrap">
                                                {axisYLabel}: {item.count > 0 ? item.averageY : '-'}
                                            </span>
                                        </div>
                                        <div className="text-xs text-ink-faint mt-1">
                                            {item.count} {t('slide_editors.grid.response', { count: item.count })}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </ResultCard>
    );
};

export default GridResult;
