import { useState } from 'react';
import { Search, X } from 'lucide-react';

const FilterBar = ({ filters, onFilterChange, onReset }) => {
  const [localFilters, setLocalFilters] = useState(filters || {});

  const handleChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  const handleReset = () => {
    const emptyFilters = {};
    setLocalFilters(emptyFilters);
    if (onReset) {
      onReset();
    } else if (onFilterChange) {
      onFilterChange(emptyFilters);
    }
  };

  const hasActiveFilters = Object.values(localFilters).some(
    (value) => value !== '' && value !== null && value !== undefined
  );

  return (
    <div className="bg-surface border border-hairline rounded-lg p-4 space-y-4">
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-ink-faint" />
            <input
              type="text"
              placeholder="Search..."
              value={localFilters.search || ''}
              onChange={(e) => handleChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface border border-[#dddddd] rounded-xs text-ink placeholder-ink-faint outline-none transition-shadow duration-150 focus:shadow-[var(--shadow-level-1)] focus:border-primary"
            />
          </div>
        </div>

        {/* Status Filter */}
        {filters.hasOwnProperty('status') && (
          <select
            value={localFilters.status || ''}
            onChange={(e) => handleChange('status', e.target.value)}
            className="px-4 py-2 bg-surface border border-[#dddddd] rounded-xs text-ink outline-none transition-shadow duration-150 focus:shadow-[var(--shadow-level-1)] focus:border-primary"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
        )}

        {/* Plan Filter */}
        {filters.hasOwnProperty('plan') && (
          <select
            value={localFilters.plan || ''}
            onChange={(e) => handleChange('plan', e.target.value)}
            className="px-4 py-2 bg-surface border border-[#dddddd] rounded-xs text-ink outline-none transition-shadow duration-150 focus:shadow-[var(--shadow-level-1)] focus:border-primary"
          >
            <option value="">All Plans</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="lifetime">Lifetime</option>
            <option value="institution">Institution</option>
          </select>
        )}

        {/* Date Range */}
        {(filters.hasOwnProperty('dateFrom') || filters.hasOwnProperty('dateTo')) && (
          <>
            <input
              type="date"
              value={localFilters.dateFrom || ''}
              onChange={(e) => handleChange('dateFrom', e.target.value)}
              className="px-4 py-2 bg-surface border border-[#dddddd] rounded-xs text-ink outline-none transition-shadow duration-150 focus:shadow-[var(--shadow-level-1)] focus:border-primary"
              placeholder="From Date"
            />
            <input
              type="date"
              value={localFilters.dateTo || ''}
              onChange={(e) => handleChange('dateTo', e.target.value)}
              className="px-4 py-2 bg-surface border border-[#dddddd] rounded-xs text-ink outline-none transition-shadow duration-150 focus:shadow-[var(--shadow-level-1)] focus:border-primary"
              placeholder="To Date"
            />
          </>
        )}

        {/* Reset Button */}
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-ink-muted hover:text-ink hover:bg-canvas-soft transition-colors border border-hairline"
          >
            <X className="w-4 h-4" />
            Reset
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterBar;

