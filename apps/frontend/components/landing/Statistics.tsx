'use client';

import { useQuery } from '@apollo/client/react';
import { TrendingUp, Users, Wallet, ArrowUpRight, Activity } from 'lucide-react';
import { GET_PLATFORM_STATISTICS } from '@/lib/queries/landing';
import { Statistics as StatisticsType } from '@/types/campaign';
import { formatEther } from 'viem';

export function Statistics() {
  const { data, loading } = useQuery<{ 
    statistics: StatisticsType[];
    campaigns: Array<{ id: string; amountRaised: string }>;
  }>(
    GET_PLATFORM_STATISTICS,
    {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'ignore',
    }
  );

  const stats = data?.statistics?.[0];
  const campaigns = data?.campaigns || [];

  // Calculate total raised from campaign amounts (not from stats.totalFundingGiven due to subgraph bug)
  const totalFundsRaised = campaigns.reduce(
    (sum, c) => sum + BigInt(c.amountRaised || '0'),
    BigInt(0)
  );

  const statisticsData = [
    {
      label: 'Total Raised',
      value: `${parseFloat(formatEther(totalFundsRaised)).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      })}`,
      suffix: 'BNB',
      icon: Wallet,
      color: 'from-emerald-500 to-teal-500',
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-400',
      trend: '+12%',
    },
    {
      label: 'Total Campaigns',
      value: stats?.totalContracts?.toLocaleString() ?? '0',
      suffix: '',
      icon: Activity,
      color: 'from-blue-500 to-cyan-500',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
      trend: '+5',
    },
    {
      label: 'Total Backers',
      value: stats?.totalBackers?.toLocaleString() ?? '0',
      suffix: '',
      icon: Users,
      color: 'from-purple-500 to-pink-500',
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-400',
      trend: '+28%',
    },
  ];

  // Always render the section - show loading state or data
  return (
    <section className="py-20 md:py-28 bg-slate-900 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f1a_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f1a_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 px-4 py-2 rounded-full text-sm font-medium mb-4 border border-blue-500/20">
            <TrendingUp className="w-4 h-4" />
            Real-time Statistics
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Platform Impact
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Join thousands of innovators and backers building the future together
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {statisticsData.map((stat, index) => (
            <div
              key={index}
              className="group relative bg-slate-800/50 backdrop-blur-sm rounded-3xl p-8 border border-slate-700/50 hover:border-slate-600 transition-all duration-300 hover:-translate-y-2 overflow-hidden"
            >
              {/* Gradient overlay on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              
              {/* Top section with icon and trend */}
              <div className="flex items-start justify-between mb-6">
                <div className={`p-4 rounded-2xl ${stat.iconBg}`}>
                  <stat.icon className={`w-7 h-7 ${stat.iconColor}`} />
                </div>
                <div className="flex items-center gap-1 text-emerald-400 text-sm font-medium bg-emerald-500/10 px-3 py-1 rounded-full">
                  <ArrowUpRight className="w-4 h-4" />
                  {stat.trend}
                </div>
              </div>
              
              {/* Value */}
              <div className="mb-2">
                {loading && !stats ? (
                  <div className="h-12 bg-slate-700 rounded-lg animate-pulse w-32" />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl md:text-6xl font-bold text-white tracking-tight">
                      {stat.value}
                    </span>
                    {stat.suffix && (
                      <span className="text-xl text-slate-400 font-medium">{stat.suffix}</span>
                    )}
                  </div>
                )}
              </div>
              
              {/* Label */}
              <p className="text-slate-400 font-medium text-lg">
                {stat.label}
              </p>
              
              {/* Bottom gradient line */}
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color} opacity-50 group-hover:opacity-100 transition-opacity`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
