export function CampaignCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
        <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full ml-2"></div>
      </div>
      
      <div className="mb-4">
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full w-full mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        </div>
        <div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
      </div>
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 animate-pulse">
      <div className="flex items-center justify-between mb-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-1"></div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-x-auto animate-pulse">
      <table className="w-full">
        <thead className="border-b border-gray-200 dark:border-gray-700">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="text-left py-3 px-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="border-b border-gray-100 dark:border-gray-700">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="py-3 px-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PageLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-8"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatsCardSkeleton key={i} />
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <CampaignCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ListSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
            </div>
            <div className="h-4 w-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
