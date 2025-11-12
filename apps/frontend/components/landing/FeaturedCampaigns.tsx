'use client';

import { useQuery } from '@apollo/client/react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { GET_FEATURED_CAMPAIGNS } from '@/lib/queries/landing';
import { Campaign } from '@/types/campaign';
import { CampaignCard } from '@/components/shared/CampaignCard';

export function FeaturedCampaigns() {
  const { data, loading, error } = useQuery<{ campaigns: Campaign[] }>(
    GET_FEATURED_CAMPAIGNS,
    {
      variables: { first: 6 },
      // Don't show error for empty results
      errorPolicy: 'all',
    }
  );

  const campaigns = data?.campaigns || [];

  return (
    <section className="py-16 md:py-20 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Featured Campaigns
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Discover the most funded projects making an impact
            </p>
          </div>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold mt-4 md:mt-0 group"
          >
            View All Projects
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

        {error && !data && (
          <div className="text-center py-12">
            <p className="text-red-500 dark:text-red-400 mb-2 font-semibold">
              Unable to load campaigns
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {error.message || 'Please check your connection or try again later.'}
            </p>
          </div>
        )}

        {!loading && !error && campaigns.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        )}

        {!loading && campaigns.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowRight className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Campaigns Yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Be the first to launch a campaign and bring your innovative ideas to life!
              </p>
              <Link
                href="/new-project"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Create Your Campaign
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
