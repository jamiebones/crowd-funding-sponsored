export function CampaignCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
      {/* Image skeleton */}
      <div className="w-full h-48 bg-gray-200 dark:bg-gray-700" />
      
      <div className="p-6">
        {/* Category badge skeleton */}
        <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full mb-3" />
        
        {/* Title skeleton */}
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
        <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
        
        {/* Progress bar skeleton */}
        <div className="space-y-2 mb-4">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="flex justify-between">
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
        
        {/* Stats skeleton */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    </div>
  );
}

export function CampaignCardListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CampaignCardSkeleton key={i} />
      ))}
    </div>
  );
}
