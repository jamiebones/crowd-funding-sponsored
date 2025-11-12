'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@apollo/client/react';
import { GET_CAMPAIGNS_BY_CATEGORY } from '@/lib/queries/category-campaigns';
import { formatEther } from 'viem';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { 
  Home,
  ChevronRight,
  Filter,
  TrendingUp,
  Users,
  Rocket,
  ArrowRight,
  Code,
  Palette,
  Users2,
  GraduationCap,
  Leaf,
  HeartPulse,
  HandHeart,
  Gift,
  MoreHorizontal
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { CATEGORY_LABELS, CATEGORY_MAP, CATEGORY_DESCRIPTIONS } from '@/lib/constants';

// Category icons
const CATEGORY_ICONS: { [key: string]: any } = {
  technology: Code,
  arts: Palette,
  community: Users2,
  education: GraduationCap,
  environment: Leaf,
  health: HeartPulse,
  social: HandHeart,
  charity: Gift,
  other: MoreHorizontal,
};

type SortOption = 'newest' | 'ending-soon' | 'most-funded' | 'most-backers';
type StatusFilter = 'all' | 'active' | 'ended';

export default function CategoryPage() {
  const params = useParams();
  const categoryName = (params?.categoryName as string)?.toLowerCase();

  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Get category enum value
  const categoryEnum = CATEGORY_MAP[categoryName];
  const categoryLabel = categoryEnum !== undefined ? CATEGORY_LABELS[categoryEnum] : '';
  const categoryDescription = CATEGORY_DESCRIPTIONS[categoryName] || '';
  const CategoryIcon = CATEGORY_ICONS[categoryName] || Rocket;

  const { data, loading, error } = useQuery(GET_CAMPAIGNS_BY_CATEGORY, {
    variables: { category: categoryEnum },
    skip: categoryEnum === undefined,
  });

  const campaigns = (data as any)?.campaigns || [];

  // Filter and sort campaigns
  const filteredAndSortedCampaigns = useMemo(() => {
    let filtered = [...campaigns];

    // Apply status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter((c: any) => c.campaignRunning);
    } else if (statusFilter === 'ended') {
      filtered = filtered.filter((c: any) => !c.campaignRunning);
    }

    // Apply sorting
    filtered.sort((a: any, b: any) => {
      switch (sortBy) {
        case 'newest':
          return Number(b.dateCreated) - Number(a.dateCreated);
        case 'ending-soon':
          // Active campaigns first, then by date
          if (a.campaignRunning && !b.campaignRunning) return -1;
          if (!a.campaignRunning && b.campaignRunning) return 1;
          return Number(a.dateCreated) - Number(b.dateCreated);
        case 'most-funded':
          return Number(BigInt(b.amountRaised) - BigInt(a.amountRaised));
        case 'most-backers':
          return b.backers - a.backers;
        default:
          return 0;
      }
    });

    return filtered;
  }, [campaigns, statusFilter, sortBy]);

  // Calculate category statistics
  const stats = useMemo(() => {
    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter((c: any) => c.campaignRunning).length;
    const totalRaised = campaigns.reduce((sum: bigint, c: any) => {
      return sum + BigInt(c.amountRaised);
    }, BigInt(0));
    const totalBackers = campaigns.reduce((sum: number, c: any) => {
      return sum + c.backers;
    }, 0);

    return { totalCampaigns, activeCampaigns, totalRaised, totalBackers };
  }, [campaigns]);

  // Calculate funding percentage
  const getFundingPercentage = (raised: string, goal: string): number => {
    const raisedBigInt = BigInt(raised);
    const goalBigInt = BigInt(goal);
    if (goalBigInt === BigInt(0)) return 0;
    return Number((raisedBigInt * BigInt(10000)) / goalBigInt) / 100;
  };

  // Invalid category
  if (categoryEnum === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-100 dark:bg-red-900 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
            <Filter className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Invalid Category
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The category "{categoryName}" doesn't exist.
          </p>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse All Campaigns
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Error Loading Campaigns
          </h2>
          <p className="text-gray-600 dark:text-gray-400">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
          <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            <Home className="h-4 w-4" />
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/projects" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Projects
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 dark:text-white font-medium">{categoryLabel}</span>
        </nav>

        {/* Category Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-start gap-6">
            <div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-4 flex-shrink-0">
              <CategoryIcon className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {categoryLabel}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">
                {categoryDescription}
              </p>

              {/* Category Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Campaigns</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalCampaigns}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats.activeCampaigns}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Raised</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {parseFloat(formatEther(stats.totalRaised)).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">BNB</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Backers</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalBackers}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Sorting */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    statusFilter === 'active'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setStatusFilter('ended')}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    statusFilter === 'ended'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Ended
                </button>
              </div>
            </div>

            {/* Sort By */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm border-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="newest">Newest First</option>
                <option value="ending-soon">Ending Soon</option>
                <option value="most-funded">Most Funded</option>
                <option value="most-backers">Most Backers</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-gray-600 dark:text-gray-400">
            Showing {filteredAndSortedCampaigns.length} {filteredAndSortedCampaigns.length === 1 ? 'campaign' : 'campaigns'}
          </p>
        </div>

        {/* Campaign Grid */}
        {filteredAndSortedCampaigns.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
                <CategoryIcon className="h-10 w-10 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                No Campaigns Found
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {statusFilter === 'active'
                  ? 'There are no active campaigns in this category yet.'
                  : statusFilter === 'ended'
                  ? 'There are no ended campaigns in this category yet.'
                  : 'There are no campaigns in this category yet. Be the first to create one!'}
              </p>
              <div className="flex gap-4 justify-center">
                <Link
                  href="/projects"
                  className="inline-flex items-center gap-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Browse All Campaigns
                </Link>
                <Link
                  href="/new-project"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Campaign
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedCampaigns.map((campaign: any) => {
              const percentage = getFundingPercentage(
                campaign.amountRaised,
                campaign.amountSought
              );

              return (
                <Link
                  key={campaign.id}
                  href={`/projects/${campaign.id}`}
                  className="block bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-lg transition-shadow overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white line-clamp-2 flex-1">
                        {campaign.content?.title || campaign.title || 'Untitled Campaign'}
                      </h3>
                      {campaign.campaignRunning ? (
                        <span className="ml-2 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full whitespace-nowrap flex-shrink-0">
                          Active
                        </span>
                      ) : (
                        <span className="ml-2 px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded-full whitespace-nowrap flex-shrink-0">
                          Ended
                        </span>
                      )}
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600 dark:text-gray-400">Progress</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Raised</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {parseFloat(formatEther(BigInt(campaign.amountRaised))).toFixed(2)} BNB
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Goal</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {parseFloat(formatEther(BigInt(campaign.amountSought))).toFixed(2)} BNB
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Users className="h-4 w-4" />
                        <span>{campaign.backers} {campaign.backers === 1 ? 'backer' : 'backers'}</span>
                      </div>
                      <span className="text-gray-500 dark:text-gray-400 text-xs">
                        {formatDistanceToNow(new Date(Number(campaign.dateCreated) * 1000), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* All Categories Link */}
        <div className="mt-12 text-center">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            <Filter className="h-4 w-4" />
            View All Categories
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
