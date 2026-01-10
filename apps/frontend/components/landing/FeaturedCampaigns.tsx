'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client/react';
import { ArrowRight, Sparkles, Rocket } from 'lucide-react';
import Link from 'next/link';
import { GET_FEATURED_CAMPAIGNS } from '@/lib/queries/landing';
import { Campaign } from '@/types/campaign';
import { CampaignCard } from '@/components/shared/CampaignCard';
import { fetchArweaveTitles } from '@/lib/fetchArweaveTitles';

export function FeaturedCampaigns() {
  const [campaignsWithTitles, setCampaignsWithTitles] = useState<Campaign[]>([]);

  const { data, loading, error } = useQuery<{ campaigns: Campaign[] }>(
    GET_FEATURED_CAMPAIGNS,
    {
      variables: { first: 6 },
      // Don't show error for empty results
      errorPolicy: 'all',
    }
  );

  const campaigns = data?.campaigns || [];

  // Fetch titles from Arweave for campaigns without titles
  useEffect(() => {
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
  }, [campaigns]);

  const displayCampaigns = campaignsWithTitles.length > 0 ? campaignsWithTitles : campaigns;

  return (
    <section className="py-20 md:py-28 bg-white dark:bg-slate-950 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-blue-500/5 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-purple-500/5 to-transparent rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
          <div>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 px-4 py-2 rounded-full text-sm font-medium mb-4 border border-amber-500/20">
              <Sparkles className="w-4 h-4" />
              Trending Now
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Featured Campaigns
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-lg">
              Discover the most funded projects making a real impact in communities worldwide
            </p>
          </div>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold px-6 py-3 rounded-xl transition-all mt-6 md:mt-0 group border border-slate-200 dark:border-slate-700"
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
                className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden"
              >
                <div className="h-48 bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-800 animate-pulse" />
                <div className="p-6 space-y-4">
                  <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
                    <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && !data && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-red-500 dark:text-red-400 mb-2 font-semibold text-lg">
              Unable to load campaigns
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {error.message || 'Please check your connection or try again later.'}
            </p>
          </div>
        )}

        {!loading && !error && displayCampaigns.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {displayCampaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        )}

        {!loading && campaigns.length === 0 && (
          <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-700 p-12">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/25">
                <Rocket className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                No Campaigns Yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg">
                Be the first to launch a campaign and bring your innovative ideas to life!
              </p>
              <Link
                href="/new-project"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white font-semibold px-8 py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"
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
