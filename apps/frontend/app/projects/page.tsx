'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { CampaignCardSkeleton } from '@/components/LoadingSkeletons';
import { fetchArweaveTitles } from '@/lib/fetchArweaveTitles';

const ITEMS_PER_PAGE = 12;

export default function ProjectsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'ended'>('all');
  const [selectedProgress, setSelectedProgress] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [campaignsWithTitles, setCampaignsWithTitles] = useState<Campaign[]>([]);

  // Build GraphQL where filter (don't filter by status at query level, do it client-side)
  const whereFilter = useMemo(() => {
    const filter: any = {};

    if (selectedCategory !== null) {
      filter.category = selectedCategory;
    }

    // Don't filter by campaignRunning here - we'll do it client-side with real-time checks

    return filter;
  }, [selectedCategory]);

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
        return { orderBy: 'endDate', orderDirection: 'asc' };
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
    errorPolicy: 'all', // Show partial data even if there are errors
  });

  // Log errors for debugging
  useEffect(() => {
    if (error) {
      console.error('GraphQL Error:', error);
      console.error('Error message:', error.message);
      if ('graphQLErrors' in error) {
        console.error('GraphQL errors:', error.graphQLErrors);
      }
      if ('networkError' in error) {
        console.error('Network error:', error.networkError);
      }
    }
  }, [error]);

  // Fetch titles from Arweave for campaigns without titles
  useEffect(() => {
    const campaigns = data?.campaigns || [];
    if (campaigns.length === 0) return;

    const fetchTitles = async () => {
      const updatedCampaigns = await fetchArweaveTitles(
        campaigns,
        (campaign) => campaign.campaignCID,
        (campaign) => !!campaign.content?.title
      );
      setCampaignsWithTitles(updatedCampaigns);
    };

    fetchTitles();
  }, [data?.campaigns]);

  // Filter by progress and search locally (since subgraph doesn't support these easily)
  const filteredCampaigns = useMemo(() => {
    // Use campaigns with fetched titles if available, otherwise use raw data
    let campaigns = campaignsWithTitles.length > 0 ? campaignsWithTitles : (data?.campaigns || []);

    // Get current timestamp for real-time status checks
    const now = Math.floor(Date.now() / 1000);

    // Apply status filter with real-time end date check
    if (selectedStatus === 'active') {
      campaigns = campaigns.filter((campaign) => {
        if (!campaign) return false;
        const endTime = campaign.endDate ? parseInt(campaign.endDate) : 0;
        return campaign.campaignRunning && (endTime === 0 || now < endTime);
      });
    } else if (selectedStatus === 'ended') {
      campaigns = campaigns.filter((campaign) => {
        if (!campaign) return false;
        const endTime = campaign.endDate ? parseInt(campaign.endDate) : 0;
        return !campaign.campaignRunning || (endTime > 0 && now >= endTime);
      });
    }

    // Apply progress filter
    if (selectedProgress !== 'all') {
      campaigns = campaigns.filter((campaign) => {
        if (!campaign?.amountRaised || !campaign?.amountSought) return false;
        
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
      campaigns = campaigns.filter((campaign) => {
        if (!campaign) return false;
        const title = campaign.content?.title || (campaign as any).fetchedTitle || campaign.title || '';
        return title.toLowerCase().includes(query);
      });
    }

    return campaigns;
  }, [campaignsWithTitles, data?.campaigns, selectedStatus, selectedProgress, searchQuery]);

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
              <CampaignCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !data && (
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400 mb-4">
              Failed to load campaigns. Please try again later.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {error.message}
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
        {!loading && filteredCampaigns.length > 0 && (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {filteredCampaigns.filter(campaign => campaign).map((campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign as Campaign} />
                ))}
              </div>
            ) : (
              <div className="space-y-4 mb-8">
                {filteredCampaigns.filter(campaign => campaign).map((campaign) => (
                  <CampaignCardList key={campaign.id} campaign={campaign as Campaign} />
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
