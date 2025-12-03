'use client';

import { useQuery } from '@apollo/client/react';
import { TrendingUp, Users, Wallet } from 'lucide-react';
import { GET_PLATFORM_STATISTICS } from '@/lib/queries/landing';
import { Statistics as StatisticsType } from '@/types/campaign';
import { formatEther } from 'viem';

export function Statistics() {
  const { data, loading, error } = useQuery<{ statistics: StatisticsType[] }>(
    GET_PLATFORM_STATISTICS
  );

  const stats = data?.statistics?.[0];

  const statisticsData = [
    {
      label: 'Total Raised',
      value: stats?.totalAmountRaised
        ? `${parseFloat(formatEther(BigInt(stats.totalAmountRaised))).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })} BNB`
        : '0 BNB',
      icon: Wallet,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      label: 'Active Campaigns',
      value: stats?.totalCampaignsRunning?.toLocaleString() ?? '0',
      icon: TrendingUp,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      label: 'Total Backers',
      value: stats?.totalBackers?.toLocaleString() ?? '0',
      icon: Users,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
  ];

  if (error) {
    return null; // Silently fail if no stats available
  }

  return (
    <section className="py-16 md:py-20 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Platform Impact
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Join thousands of innovators and backers building the future
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {statisticsData.map((stat, index) => (
            <div
              key={index}
              className="group bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl p-8 text-center border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-2 transform"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${stat.bgColor} mb-4`}>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <div className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
                {loading ? (
                  <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32 mx-auto" />
                ) : (
                  stat.value
                )}
              </div>
              <div className="text-sm md:text-base text-gray-600 dark:text-gray-400 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
