export function CampaignDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb skeleton */}
        <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-8" />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
              <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
              <div className="flex gap-4">
                <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
            
            {/* Media gallery skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
            
            {/* Description skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Funding progress skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="h-8 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full mb-6" />
              <div className="space-y-4">
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
            
            {/* Stats skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
