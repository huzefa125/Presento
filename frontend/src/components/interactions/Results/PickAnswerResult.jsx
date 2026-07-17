import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTranslation } from 'react-i18next';

const PickAnswerResult = ({ slide, data }) => {
  const { t } = useTranslation();
  // Backend returns voteCounts directly, not responses array
  const voteCounts = data?.voteCounts || {};
  const totalResponses = data?.totalResponses || 0;

  // Prepare data for chart - use voteCounts from backend
  const chartData = slide.options?.map((option, index) => {
    const optionText = typeof option === 'string' ? option : (option?.text || `Option ${index + 1}`);
    const key = typeof option === 'string' ? option : (option?.text || String(option));
    return {
      name: optionText,
      votes: voteCounts[key] || 0
    };
  }) || [];

  const totalVotes = totalResponses || Object.values(voteCounts).reduce((sum, count) => sum + count, 0);

  // Sticker accent colors for the bars (decorative only, data untouched)
  const COLORS = ['#62aef0', '#ff64c8', '#2a9d99', '#dd5b00', '#391c57', '#1aae39', '#523410'];

  return (
    <div className="space-y-6">
      <div className="bg-surface rounded-xl border border-hairline p-6">
        <h3 className="text-xl font-semibold text-ink mb-4">{t('presentation_results.common_labels.question')}</h3>
        <p className="text-ink text-lg">{typeof slide.question === 'string' ? slide.question : (slide.question?.text || '')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="bg-surface rounded-xl border border-hairline p-6">
          <h3 className="text-xl font-semibold text-ink mb-4">{t('presentation_results.common_labels.results_distribution')}</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 60,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e6e6" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tick={{ fill: '#615d59' }}
                />
                <YAxis tick={{ fill: '#615d59' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e6e6e6', color: '#000000' }}
                  itemStyle={{ color: '#000000' }}
                  labelStyle={{ color: '#1aae39', fontWeight: 'bold' }}
                />
                <Bar dataKey="votes">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-surface rounded-xl border border-hairline p-6">
          <h3 className="text-xl font-semibold text-ink mb-4">{t('presentation_results.common_labels.statistics')}</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-hairline">
              <span className="text-ink-muted">{t('presentation_results.common_labels.total_responses_label')}</span>
              <span className="text-ink font-semibold">{totalVotes}</span>
            </div>

            {chartData.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-hairline">
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="text-ink">{item.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-ink font-semibold">{item.votes}</div>
                  <div className="text-xs text-ink-muted">
                    {totalVotes > 0 ? ((item.votes / totalVotes) * 100).toFixed(1) : 0}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Raw Data */}
      <div className="bg-surface rounded-xl border border-hairline p-6">
        <h3 className="text-xl font-semibold text-ink mb-4">{t('presentation_results.common_labels.raw_data')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-hairline">
                <th className="text-left py-3 px-4 text-ink-muted">{t('presentation_results.common_labels.option')}</th>
                <th className="text-left py-3 px-4 text-ink-muted">{t('presentation_results.common_labels.votes')}</th>
                <th className="text-left py-3 px-4 text-ink-muted">{t('presentation_results.common_labels.percentage')}</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((item, index) => (
                <tr key={index} className="border-b border-hairline hover:bg-canvas-soft">
                  <td className="py-3 px-4 text-ink">{item.name}</td>
                  <td className="py-3 px-4 text-ink">{item.votes}</td>
                  <td className="py-3 px-4 text-ink">
                    {totalVotes > 0 ? ((item.votes / totalVotes) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PickAnswerResult;