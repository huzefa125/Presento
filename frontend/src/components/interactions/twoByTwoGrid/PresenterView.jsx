import { useMemo, useState, useEffect } from 'react';
import { Users } from 'lucide-react';
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

const TwoByTwoGridPresenterView = ({
  slide,
  gridResults = [],
  totalResponses = 0
}) => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const hasResponses = totalResponses > 0 && Array.isArray(gridResults) && gridResults.length > 0;

  const axisXLabel = useMemo(() => slide?.gridAxisXLabel || 'Horizontal', [slide?.gridAxisXLabel]);
  const axisYLabel = useMemo(() => slide?.gridAxisYLabel || 'Vertical', [slide?.gridAxisYLabel]);

  const axisRange = useMemo(() => {
    return {
      min: slide?.gridAxisRange?.min ?? 0,
      max: slide?.gridAxisRange?.max ?? 10
    };
  }, [slide]);

  const colors = useMemo(() => {
    return [
      'rgb(239, 68, 68)',   // red
      'rgb(59, 130, 246)',  // blue
      'rgb(16, 185, 129)',  // green
      'rgb(245, 158, 11)',  // amber
      'rgb(139, 92, 246)',  // violet
      'rgb(236, 72, 153)',  // pink
      'rgb(14, 165, 233)',  // sky
      'rgb(132, 204, 22)',  // lime
      'rgb(251, 146, 60)',  // orange
      'rgb(168, 85, 247)',  // purple
    ];
  }, [])

  const chartData = useMemo(() => {
    if (!hasResponses) {
      return {
        datasets: []
      };
    }

    // Show only one dot per item at the average position (actual axis values)
    const datasets = gridResults.map((item, index) => {
      if (item.count === 0) {
        return {
          label: item.label,
          data: [],
          backgroundColor: colors[index % colors.length],
          borderColor: colors[index % colors.length],
          pointRadius: 10,
          pointHoverRadius: 12,
        };
      }

      // Use actual axis values (no conversion needed)
      return {
        label: item.label,
        data: [{ x: Math.round(item.averageX * 10) / 10, y: Math.round(item.averageY * 10) / 10 }],
        backgroundColor: colors[index % colors.length],
        borderColor: colors[index % colors.length],
        pointRadius: 10,
        pointHoverRadius: 12,
      };
    });

    return { datasets };
  }, [hasResponses, gridResults, colors]);

  const options = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
          min: axisRange.min,
          max: axisRange.max,
          title: {
            display: true,
            text: axisXLabel,
            color: '#E0E0E0',
            font: {
              size: isMobile ? 12 : 16,
              weight: 'bold'
            }
          },
          grid: {
            display: true,
            drawBorder: true,
            color: (context) => {
              const midValue = (axisRange.min + axisRange.max) / 2;
              if (context.tick.value === midValue) {
                return 'rgba(255, 255, 255, 0.2)';
              }
              return 'rgba(255, 255, 255, 0.05)';
            },
            lineWidth: (context) => {
              const midValue = (axisRange.min + axisRange.max) / 2;
              if (context.tick.value === midValue) {
                return 2;
              }
              return 1;
            }
          },
          ticks: {
            color: '#E0E0E0',
            font: {
              size: isMobile ? 10 : 12
            }
          }
        },
        y: {
          type: 'linear',
          min: axisRange.min,
          max: axisRange.max,
          title: {
            display: true,
            text: axisYLabel,
            color: '#E0E0E0',
            font: {
              size: isMobile ? 12 : 16,
              weight: 'bold'
            }
          },
          grid: {
            display: true,
            drawBorder: true,
            color: (context) => {
              const midValue = (axisRange.min + axisRange.max) / 2;
              if (context.tick.value === midValue) {
                return 'rgba(255, 255, 255, 0.2)';
              }
              return 'rgba(255, 255, 255, 0.05)';
            },
            lineWidth: (context) => {
              const midValue = (axisRange.min + axisRange.max) / 2;
              if (context.tick.value === midValue) {
                return 2;
              }
              return 1;
            }
          },
          ticks: {
            color: '#E0E0E0',
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
            usePointStyle: true,
            padding: isMobile ? 10 : 15,
            color: '#E0E0E0',
            font: {
              size: isMobile ? 10 : 12
            },
            boxWidth: isMobile ? 10 : 12,
            boxHeight: isMobile ? 10 : 12
          }
        },
        tooltip: {
          backgroundColor: '#1F1F1F',
          borderColor: '#2A2A2A',
          borderWidth: 1,
          titleColor: '#E0E0E0',
          bodyColor: '#E0E0E0',
          titleFont: {
            size: isMobile ? 11 : 13
          },
          bodyFont: {
            size: isMobile ? 10 : 12
          },
          callbacks: {
            label: function (context) {
              const label = context.dataset.label || '';
              return `${label}:  ( ${axisXLabel} - ${context.parsed.x}, ${axisYLabel} - ${context.parsed.y} )`;
            }
          }
        }
      },
      animation: {
        duration: 750,
        easing: 'easeInOutQuart'
      }
    };
  }, [axisRange, axisXLabel, axisYLabel, isMobile]);
  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6 px-2 sm:px-4">
      <div className="rounded-xl sm:rounded-2xl md:rounded-3xl border border-[#2A2A2A] bg-[#1F1F1F] p-4 sm:p-5 md:p-6 lg:p-8 shadow-xl">
        <div className="flex flex-col gap-3 sm:gap-4 md:gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[#E0E0E0] px-1">
              {typeof slide?.question === 'string' 
                ? slide.question 
                : (slide?.question?.text || slide?.question?.label || '2×2 Grid results')}
            </h2>
            <div className="flex items-center gap-2 rounded-full bg-[#1D2A20] border border-[#2E7D32]/30 px-3 sm:px-4 py-1.5 sm:py-2">
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-[#4CAF50]" />
              <span className="text-xs sm:text-sm font-medium text-[#4CAF50]">
                {totalResponses} response{totalResponses === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 md:gap-6 items-start">
            {/* Left: Scatter Graph */}
            <div className="flex-1 w-full lg:flex-[1.3] lg:min-w-[520px]">
              {!hasResponses ? (
                <div className="flex items-center justify-center py-16 sm:py-24 md:py-32 text-[#6C6C6C] bg-[#2A2A2A] rounded-lg sm:rounded-xl">
                  <p className="text-xs sm:text-sm">Waiting for responses...</p>
                </div>
              ) : (
                <div className="bg-[#2A2A2A] rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 cursor-pointer" style={{ height: 'clamp(300px, 50vh, 420px)' }}>
                  <Scatter data={chartData} options={options} />
                </div>
              )}
            </div>

            {/* Right: Items List */}
            <div className="w-full lg:flex-1">
              <h3 className="text-xs sm:text-sm font-semibold text-[#E0E0E0] mb-2 sm:mb-3">Items</h3>
              <div className="space-y-2 sm:space-y-3">
                {gridResults.length === 0 ? (
                  <div className="text-center text-xs sm:text-sm text-[#6C6C6C] py-6 sm:py-8 bg-[#2A2A2A] rounded-lg">
                    No items configured
                  </div>
                ) : (
                  gridResults.map((item, index) => {
                    // Display actual axis values (no conversion needed)
                    const displayX = item.count > 0 ? item.averageX : 0;
                    const displayY = item.count > 0 ? item.averageY : 0;

                    return (
                      <div key={item.id} className="bg-[#2A2A2A] rounded-lg p-3 sm:p-4 border border-[#2F2F2F]">
                        <div className="flex items-center gap-2 sm:gap-3 mb-2">
                          <div
                            className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: colors[index % colors.length] }}
                          />
                          <span className="text-sm sm:text-base font-semibold text-[#E0E0E0] break-words">
                            {typeof item.label === 'string' 
                              ? item.label 
                              : (item.text || item.label?.text || item.label?.label || '')}
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm text-[#B0B0B0] ml-5 sm:ml-7">
                          <div className="flex flex-wrap gap-x-2">
                            <span>{axisXLabel}: {displayX.toFixed(1)}</span>
                            <span>/</span>
                            <span>{axisYLabel}: {displayY.toFixed(1)}</span>
                          </div>
                          <div className="text-xs text-[#6C6C6C] mt-1">{item.count} response{item.count === 1 ? '' : 's'}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwoByTwoGridPresenterView;
