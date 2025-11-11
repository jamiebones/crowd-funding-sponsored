'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_ALL_CAMPAIGNS } from '@/lib/queries/campaigns';
import { Campaign } from '@/types/campaign';
import { CampaignCard } from '@/components/shared/CampaignCard';
import { CampaignCardList } from '@/components/shared/CampaignCardList';
import { FilterBar } from '@/components/projects/FilterBar';
import { SearchAndSort } from '@/components/projects/SearchAndSort';
import { Pagination } from '@/components/shared/Pagination';
import { formatEther } from 'viem';
import Link from 'next/link';
import { Plus } from 'lucide-react';

const ITEMS_PER_PAGE = 12;

export default function ProjectsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'ended'>('all');
  const [selectedProgress, setSelectedProgress] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Build GraphQL where filter
  const whereFilter = useMemo(() => {
    const filter: any = {};

    if (selectedCategory !== null) {
      filter.category = selectedCategory;
    }

    if (selectedStatus === 'active') {
      filter.campaignRunning = true;
    } else if (selectedStatus === 'ended') {
      filter.campaignRunning = false;
    }

    return filter;
  }, [selectedCategory, selectedStatus]);

  // Build orderBy and orderDirection
  const { orderBy, orderDirection } = useMemo(() => {
    switch (sortBy) {
      case 'newest':
        return { orderBy: 'dateCreated', orderDirection: 'desc' };
      case 'oldest':
        return { orderBy: 'dateCreated', orderDirection: 'asc' };
      case 'most-funded':
        return { orderBy: 'amountRaised', orderDirection: 'desc' };
      case 'least-funded':
        return { orderBy: 'amountRaised', orderDirection: 'asc' };
      case 'most-backers':
        return { orderBy: 'backers', orderDirection: 'desc' };
      case 'ending-soon':
        return { orderBy: 'dateEnded', orderDirection: 'asc' };
      default:
        return { orderBy: 'dateCreated', orderDirection: 'desc' };
    }
  }, [sortBy]);

  // Fetch campaigns
  const { data, loading, error } = useQuery<{ campaigns: Campaign[] }>(GET_ALL_CAMPAIGNS, {
    variables: {
      first: ITEMS_PER_PAGE,
      skip: (currentPage - 1) * ITEMS_PER_PAGE,
      orderBy,
      orderDirection,
      where: whereFilter,
    },
  });

  // Filter by progress and search locally (since subgraph doesn't support these easily)
  const filteredCampaigns = useMemo(() => {
    let campaigns = data?.campaigns || [];

    // Apply progress filter
    if (selectedProgress !== 'all') {
      campaigns = campaigns.filter((campaign) => {
        const progress =
          (parseFloat(formatEther(BigInt(campaign.amountRaised))) /
            parseFloat(formatEther(BigInt(campaign.amountSought)))) *
          100;

        switch (selectedProgress) {
          case '0-25':
            return progress >= 0 && progress < 25;
          case '25-50':
            return progress >= 25 && progress < 50;
          case '50-75':
            return progress >= 50 && progress < 75;
          case '75-100':
            return progress >= 75 && progress < 100;
          case '100+':
            return progress >= 100;
          default:
            return true;
        }
      });
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      campaigns = campaigns.filter((campaign) =>
        campaign.title.toLowerCase().includes(query)
      );
    }

    return campaigns;
  }, [data?.campaigns, selectedProgress, searchQuery]);

  const totalPages = Math.ceil((filteredCampaigns.length || 0) / ITEMS_PER_PAGE);

  // Reset to page 1 when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Explore Campaigns
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Discover and support innovative projects
            </p>
          </div>
          <Link
            href="/new-project"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Campaign
          </Link>
        </div>

        {/* Search and Sort */}
        <div className="mb-4">
          <SearchAndSort
            searchQuery={searchQuery}
            onSearchChange={(query) => {
              setSearchQuery(query);
              handleFilterChange();
            }}
            sortBy={sortBy}
            onSortChange={setSortBy}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>

        {/* Filters */}
        <div className="mb-8">
          <FilterBar
            selectedCategory={selectedCategory}
            onCategoryChange={(category) => {
              setSelectedCategory(category);
              handleFilterChange();
            }}
            selectedStatus={selectedStatus}
            onStatusChange={(status) => {
              setSelectedStatus(status);
              handleFilterChange();
            }}
            selectedProgress={selectedProgress}
            onProgressChange={(progress) => {
              setSelectedProgress(progress);
              handleFilterChange();
            }}
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div className="h-48 bg-gray-200 dark:bg-gray-700 animate-pulse" />
                <div className="p-6 space-y-4">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400 mb-4">
              Failed to load campaigns. Please try again later.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Campaign Grid/List */}
        {!loading && !error && filteredCampaigns.length > 0 && (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {filteredCampaigns.map((campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
              </div>
            ) : (
              <div className="space-y-4 mb-8">
                {filteredCampaigns.map((campaign) => (
                  <CampaignCardList key={campaign.id} campaign={campaign} />
                ))}
              </div>
            )}

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredCampaigns.length}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </>
        )}

        {/* Empty State */}
        {!loading && !error && filteredCampaigns.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No campaigns found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Try adjusting your filters or search query
            </p>
            <button
              onClick={() => {
                setSelectedCategory(null);
                setSelectedStatus('all');
                setSelectedProgress('all');
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
