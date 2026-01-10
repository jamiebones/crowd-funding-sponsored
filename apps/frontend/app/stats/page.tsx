'use client';

import { useQuery } from '@apollo/client/react';
import { Loader2, TrendingUp, Users, Target, Coins, BarChart3, PieChart } from 'lucide-react';
import { formatEther } from 'viem';
import { CATEGORIES } from '@/lib/constants';
import Link from 'next/link';
import { GET_PLATFORM_STATS, PlatformStatsData } from '@/lib/queries/platform-stats';

export default function StatsPage() {
  const { data, loading } = useQuery<PlatformStatsData>(GET_PLATFORM_STATS);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading statistics...</p>
        </div>
      </div>
    );
  }

  const stats = data?.statistics?.[0];
  const campaigns = data?.campaigns || [];

  // Calculate totals from campaign data
  // NOTE: Do NOT use stats.totalFundingGiven - it has a bug in the subgraph where it's 
  // initialized to the first campaign's goal instead of 0, making it inaccurate.
  // Always calculate from the sum of campaign.amountRaised values.
  const totalCampaigns = stats?.totalContracts ? Number(stats.totalContracts) : campaigns.length;
  
  // Sum all campaign amountRaised values (actual funds in campaigns)
  const totalFundsRaised = campaigns.reduce(
    (sum: bigint, c) => sum + BigInt(c.amountRaised || '0'), 
    BigInt(0)
  );
  
  // Total backers from statistics entity
  const totalBackers = stats?.totalBackers 
    ? Number(stats.totalBackers)
    : 0;

  // Category color mapping
  const categoryColors: { [key: number]: string } = {
    0: 'bg-blue-500',
    1: 'bg-pink-500',
    2: 'bg-green-500',
    3: 'bg-yellow-500',
    4: 'bg-emerald-500',
    5: 'bg-red-500',
    6: 'bg-purple-500',
    7: 'bg-orange-500',
    8: 'bg-gray-500',
  };

  // Calculate category breakdown
  const categoryStats = CATEGORIES.map(category => {
    const categoryCampaigns = campaigns.filter((c) => c.category === category.id);
    const totalRaised = categoryCampaigns.reduce(
      (sum: bigint, c) => sum + BigInt(c.amountRaised || '0'),
      BigInt(0)
    );
    return {
      ...category,
      count: categoryCampaigns.length,
      totalRaised,
      color: categoryColors[category.id],
    };
  }).filter(cat => cat.count > 0);

  // Calculate active vs completed
  const activeCampaigns = campaigns.filter((c) => c.campaignRunning).length;
  const completedCampaigns = campaigns.filter((c) => !c.campaignRunning).length;

  // Calculate success rate (campaigns that reached goal)
  const successfulCampaigns = campaigns.filter(
    (c) => BigInt(c.amountRaised) >= BigInt(c.amountSought)
  ).length;
  const successRate = campaigns.length > 0
    ? ((successfulCampaigns / campaigns.length) * 100).toFixed(1)
    : '0';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Platform Statistics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time insights into our crowdfunding platform
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Campaigns */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {totalCampaigns}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Campaigns</p>
          </div>

          {/* Total Raised */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <Coins className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {parseFloat(formatEther(totalFundsRaised)).toFixed(4)} BNB
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Funds Raised</p>
          </div>

          {/* Total Backers */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {totalBackers}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Backers</p>
          </div>

          {/* Success Rate */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {successRate}%
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Success Rate</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Campaign Status */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-6">
              <PieChart className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Campaign Status
              </h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <span className="text-gray-700 dark:text-gray-300">Active Campaigns</span>
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {activeCampaigns}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <span className="text-gray-700 dark:text-gray-300">Completed Campaigns</span>
                <span className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                  {completedCampaigns}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <span className="text-gray-700 dark:text-gray-300">Successful Campaigns</span>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {successfulCampaigns}
                </span>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Top Categories
              </h2>
            </div>
            <div className="space-y-3">
              {categoryStats
                .sort((a, b) => b.count - a.count)
                .slice(0, 5)
                .map(cat => (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.name.toLowerCase()}`}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${cat.color} rounded-lg flex items-center justify-center`}>
                        <span className="text-xl">{cat.icon}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {cat.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {parseFloat(formatEther(cat.totalRaised)).toFixed(2)} BNB raised
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {cat.count}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">campaigns</p>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Ready to Make a Difference?</h2>
          <p className="mb-6 opacity-90">
            Join thousands of backers supporting amazing projects
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/projects"
              className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Browse Projects
            </Link>
            <Link
              href="/new-project"
              className="px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg transition-colors"
            >
              Start a Campaign
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
