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

  // Colors for the bars
  const COLORS = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336', '#00BCD4', '#8BC34A'];

  return (
    <div className="space-y-6">
      <div className="bg-[#1F1F1F] rounded-xl border border-[#2A2A2A] p-6">
        <h3 className="text-xl font-semibold text-[#E0E0E0] mb-4">{t('presentation_results.common_labels.question')}</h3>
        <p className="text-[#E0E0E0] text-lg">{typeof slide.question === 'string' ? slide.question : (slide.question?.text || '')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="bg-[#1F1F1F] rounded-xl border border-[#2A2A2A] p-6">
          <h3 className="text-xl font-semibold text-[#E0E0E0] mb-4">{t('presentation_results.common_labels.results_distribution')}</h3>
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
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={60}
                  tick={{ fill: '#E0E0E0' }}
                />
                <YAxis tick={{ fill: '#E0E0E0' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#2A2A2A', borderColor: '#333', color: '#E0E0E0' }}
                  itemStyle={{ color: '#E0E0E0' }}
                  labelStyle={{ color: '#4CAF50', fontWeight: 'bold' }}
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
        <div className="bg-[#1F1F1F] rounded-xl border border-[#2A2A2A] p-6">
          <h3 className="text-xl font-semibold text-[#E0E0E0] mb-4">{t('presentation_results.common_labels.statistics')}</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-[#2A2A2A]">
              <span className="text-[#9E9E9E]">{t('presentation_results.common_labels.total_responses_label')}</span>
              <span className="text-[#E0E0E0] font-semibold">{totalVotes}</span>
            </div>
            
            {chartData.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-[#2A2A2A]">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="text-[#E0E0E0]">{item.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-[#E0E0E0] font-semibold">{item.votes}</div>
                  <div className="text-xs text-[#9E9E9E]">
                    {totalVotes > 0 ? ((item.votes / totalVotes) * 100).toFixed(1) : 0}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Raw Data */}
      <div className="bg-[#1F1F1F] rounded-xl border border-[#2A2A2A] p-6">
        <h3 className="text-xl font-semibold text-[#E0E0E0] mb-4">{t('presentation_results.common_labels.raw_data')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2A2A2A]">
                <th className="text-left py-3 px-4 text-[#9E9E9E]">{t('presentation_results.common_labels.option')}</th>
                <th className="text-left py-3 px-4 text-[#9E9E9E]">{t('presentation_results.common_labels.votes')}</th>
                <th className="text-left py-3 px-4 text-[#9E9E9E]">{t('presentation_results.common_labels.percentage')}</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((item, index) => (
                <tr key={index} className="border-b border-[#2A2A2A] hover:bg-[#2A2A2A]">
                  <td className="py-3 px-4 text-[#E0E0E0]">{item.name}</td>
                  <td className="py-3 px-4 text-[#E0E0E0]">{item.votes}</td>
                  <td className="py-3 px-4 text-[#E0E0E0]">
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