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
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-ink-muted">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-hairline">
        <table className="w-full">
          <thead>
            <tr className="bg-canvas-soft border-b border-hairline">
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="text-left py-3 px-4 text-xs font-semibold tracking-wide text-ink-muted uppercase"
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
                className="border-b border-hairline last:border-b-0 text-[15px] text-ink hover:bg-canvas-soft transition-colors"
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

