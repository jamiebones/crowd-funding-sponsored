'use client';

import { useSearchParams } from 'next/navigation';
import { useQuery } from '@apollo/client/react';
import { SEARCH_CAMPAIGNS } from '@/lib/queries/campaigns';
import { Campaign } from '@/types/campaign';
import { useState } from 'react';
import { CampaignCard } from '@/components/shared/CampaignCard';
import { CampaignCardList } from '@/components/shared/CampaignCardList';
import { FilterBar } from '@/components/projects/FilterBar';
import { Pagination } from '@/components/shared/Pagination';
import { Loader2, Search as SearchIcon, Grid, List } from 'lucide-react';

const ITEMS_PER_PAGE = 12;

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const [category, setCategory] = useState<number | null>(null);
  const [status, setStatus] = useState<'all' | 'active' | 'ended'>('all');
  const [progress, setProgress] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  const { data, loading, error } = useQuery(SEARCH_CAMPAIGNS, {
    variables: {
      searchText: query,
      first: ITEMS_PER_PAGE,
      skip: skip,
    },
    skip: !query,
  });

  const campaigns: Campaign[] = (data as any)?.campaignSearch || [];

  // Apply client-side filters
  const filteredCampaigns = campaigns.filter((campaign) => {
    // Category filter
    if (category !== null && campaign.category !== category) {
      return false;
    }

    // Status filter
    if (status === 'active' && !campaign.campaignRunning) {
      return false;
    }
    if (status === 'ended' && campaign.campaignRunning) {
      return false;
    }

    // Progress filter
    if (progress !== 'all') {
      const raised = BigInt(campaign.amountRaised || '0');
      const goal = BigInt(campaign.amountSought);
      const percentage = goal > BigInt(0) ? Number((raised * BigInt(100)) / goal) : 0;

      switch (progress) {
        case '0-25':
          if (percentage >= 25) return false;
          break;
        case '25-50':
          if (percentage < 25 || percentage >= 50) return false;
          break;
        case '50-75':
          if (percentage < 50 || percentage >= 75) return false;
          break;
        case '75-100':
          if (percentage < 75 || percentage >= 100) return false;
          break;
        case '100+':
          if (percentage < 100) return false;
          break;
      }
    }

    return true;
  });

  const totalPages = Math.ceil(filteredCampaigns.length / ITEMS_PER_PAGE);

  if (!query) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <SearchIcon className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Search Campaigns
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Enter a search term to find campaigns
            </p>
            <a
              href="/projects"
              className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
            >
              Browse All Campaigns →
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <SearchIcon className="w-6 h-6 text-gray-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Search Results
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Showing results for{' '}
            <span className="font-semibold text-gray-900 dark:text-white">
              &quot;{query}&quot;
            </span>
          </p>
          {!loading && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {filteredCampaigns.length} campaign(s) found
            </p>
          )}
        </div>

        {/* Filters */}
        <FilterBar
          selectedCategory={category}
          onCategoryChange={setCategory}
          selectedStatus={status}
          onStatusChange={setStatus}
          selectedProgress={progress}
          onProgressChange={setProgress}
        />

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {!loading && `${filteredCampaigns.length} results`}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              aria-label="Grid view"
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              aria-label="List view"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Searching campaigns...
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Search Error
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Results */}
        {!loading && !error && (
          <>
            {filteredCampaigns.length === 0 ? (
              <div className="text-center py-20">
                <SearchIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  No Results Found
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  We couldn&apos;t find any campaigns matching &quot;{query}
                  &quot;
                  {(category !== null || status !== 'all' || progress !== 'all') &&
                    ' with the selected filters'}
                  .
                </p>
                <div className="flex items-center justify-center gap-4">
                  {(category !== null ||
                    status !== 'all' ||
                    progress !== 'all') && (
                    <button
                      onClick={() => {
                        setCategory(null);
                        setStatus('all');
                        setProgress('all');
                      }}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Clear Filters
                    </button>
                  )}
                  <a
                    href="/projects"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Browse All Campaigns
                  </a>
                </div>
              </div>
            ) : (
              <>
                {/* Grid View */}
                {viewMode === 'grid' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {filteredCampaigns.map((campaign) => (
                      <CampaignCard key={campaign.id} campaign={campaign} />
                    ))}
                  </div>
                )}

                {/* List View */}
                {viewMode === 'list' && (
                  <div className="space-y-4 mb-8">
                    {filteredCampaigns.map((campaign) => (
                      <CampaignCardList key={campaign.id} campaign={campaign} />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
