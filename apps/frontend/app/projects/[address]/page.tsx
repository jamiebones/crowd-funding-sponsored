'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@apollo/client/react';
import { GET_CAMPAIGN_DETAIL } from '@/lib/queries/campaign-detail';
import { Campaign, CampaignContent } from '@/types/campaign';
import { useState, useEffect } from 'react';
import { CampaignHeader } from '@/components/campaign/CampaignHeader';
import { MediaGallery } from '@/components/campaign/MediaGallery';
import { FundingProgress } from '@/components/campaign/FundingProgress';
import { MilestoneTimeline } from '@/components/campaign/MilestoneTimeline';
import { RecentDonations } from '@/components/campaign/RecentDonations';
import { CATEGORIES } from '@/lib/constants';
import { addressToSubgraphId } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export default function CampaignDetailPage() {
  const params = useParams();
  const address = params.address as string;
  
  // Convert address to subgraph ID format if it looks like a normal address
  // The subgraph uses Bytes.fromUTF8(address.toHexString()) as ID
  const campaignId = address.startsWith('0x') && address.length === 42
    ? addressToSubgraphId(address.toLowerCase())
    : address.toLowerCase();

  const { data, loading, error } = useQuery(GET_CAMPAIGN_DETAIL, {
    variables: { id: campaignId },
    skip: !address,
  });

  const [campaignContent, setCampaignContent] = useState<CampaignContent | null>(
    null
  );
  const [contentLoading, setContentLoading] = useState(false);

  const campaign: Campaign | undefined = (data as any)?.campaign;

  // Fetch campaign content from Arweave
  useEffect(() => {
    if (!campaign?.campaignCID) return;

    const abortController = new AbortController();
    setContentLoading(true);
    
    fetch(`https://arweave.net/${campaign.campaignCID}`, {
      signal: abortController.signal,
    })
      .then((res) => res.json())
      .then((content: CampaignContent) => {
        setCampaignContent(content);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error('Failed to fetch campaign content:', err);
        }
      })
      .finally(() => {
        setContentLoading(false);
      });

    return () => {
      abortController.abort();
    };
  }, [campaign?.campaignCID]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading campaign...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Error Loading Campaign
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error.message}
          </p>
          <a
            href="/projects"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Browse All Campaigns
          </a>
        </div>
      </div>
    );
  }

  // Campaign not found
  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Campaign Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The campaign at address{' '}
            <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
              {address}
            </code>{' '}
            does not exist.
          </p>
          <a
            href="/projects"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Browse All Campaigns
          </a>
        </div>
      </div>
    );
  }

  const categoryInfo = CATEGORIES.find((cat) => cat.id === campaign.category);
  const categoryIcon = categoryInfo?.icon || '📦';

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Campaign Header */}
        <CampaignHeader campaign={campaign} campaignContent={campaignContent} />

        {/* Main Content Grid */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content (2/3 width) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Media Gallery */}
            <MediaGallery
              media={campaignContent?.media || []}
              categoryIcon={categoryIcon}
            />

            {/* Campaign Description */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                About This Campaign
              </h2>
              {contentLoading ? (
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading description...</span>
                </div>
              ) : campaignContent?.details ? (
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {campaignContent.details}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic">
                  No description available.
                </p>
              )}
            </div>

            {/* Milestone Timeline */}
            <MilestoneTimeline campaign={campaign} />

            {/* Recent Donations */}
            <RecentDonations campaign={campaign} />
          </div>

          {/* Right Column - Sidebar (1/3 width) */}
          <div className="lg:col-span-1">
            <FundingProgress campaign={campaign} />
          </div>
        </div>
      </div>
    </main>
  );
}
