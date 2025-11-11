import { CATEGORIES } from '@/lib/constants';
import { ChevronDown } from 'lucide-react';

interface FilterBarProps {
  selectedCategory: number | null;
  onCategoryChange: (category: number | null) => void;
  selectedStatus: 'all' | 'active' | 'ended';
  onStatusChange: (status: 'all' | 'active' | 'ended') => void;
  selectedProgress: string;
  onProgressChange: (progress: string) => void;
}

export function FilterBar({
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  selectedProgress,
  onProgressChange,
}: FilterBarProps) {
  const progressRanges = [
    { value: 'all', label: 'All Progress' },
    { value: '0-25', label: '0-25%' },
    { value: '25-50', label: '25-50%' },
    { value: '50-75', label: '50-75%' },
    { value: '75-100', label: '75-100%' },
    { value: '100+', label: '100%+' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Category
          </label>
          <div className="relative">
            <select
              value={selectedCategory ?? 'all'}
              onChange={(e) =>
                onCategoryChange(e.target.value === 'all' ? null : parseInt(e.target.value))
              }
              className="w-full appearance-none bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status
          </label>
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value as 'all' | 'active' | 'ended')}
              className="w-full appearance-none bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="ended">Ended</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Progress Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Funding Progress
          </label>
          <div className="relative">
            <select
              value={selectedProgress}
              onChange={(e) => onProgressChange(e.target.value)}
              className="w-full appearance-none bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {progressRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
