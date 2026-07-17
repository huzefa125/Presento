import Pagination from './Pagination';

const DataTable = ({ 
  columns, 
  data, 
  loading = false, 
  pagination, 
  onPageChange,
  onLimitChange,
  renderRow,
  emptyMessage = 'No data available',
  showLimitSelector = true,
  limitOptions
}) => {
  const handlePageChange = (newPage) => {
    if (onPageChange && newPage >= 1 && newPage <= pagination?.pages) {
      onPageChange(newPage);
    }
  };

  const handleLimitChange = (newLimit) => {
    if (onLimitChange) {
      onLimitChange(newLimit);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="text-left py-3 px-4 text-sm font-medium text-slate-400"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr
                key={item._id || index}
                className="border-b border-slate-800/50 hover:bg-slate-900/50 transition-colors"
              >
                {renderRow(item, index)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && (
        <Pagination
          pagination={pagination}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          showLimitSelector={showLimitSelector}
          limitOptions={limitOptions}
        />
      )}
    </div>
  );
};

export default DataTable;

