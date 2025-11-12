import { useQuery } from '@apollo/client/react';
import { GET_USER_CAMPAIGNS } from '@/lib/queries/dashboard';
import Link from 'next/link';
import { CATEGORIES } from '@/lib/constants';
import { ExternalLink, TrendingUp, Users, Calendar, Edit } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useEffect, useState } from 'react';

interface MyCampaignsProps {
  address: string;
}

interface CampaignWithContent {
  [key: string]: any;
  fetchedTitle?: string;
}

export function MyCampaigns({ address }: MyCampaignsProps) {
  const { data, loading, error } = useQuery(GET_USER_CAMPAIGNS, {
    variables: { owner: address.toLowerCase() },
  });

  const [campaignsWithTitles, setCampaignsWithTitles] = useState<CampaignWithContent[]>([]);

  // Fetch titles from Arweave for campaigns without content.title
  useEffect(() => {
    const campaigns = (data as any)?.campaigns || [];
    if (campaigns.length === 0) return;

    const fetchTitles = async () => {
      const updatedCampaigns = await Promise.all(
        campaigns.map(async (campaign: any) => {
          // If title exists in subgraph, use it
          if (campaign.content?.title) {
            return campaign;
          }

          // Otherwise, fetch from Arweave
          if (campaign.campaignCID) {
            try {
              const response = await fetch(`https://arweave.net/${campaign.campaignCID}`);
              const content = await response.json();
              return { ...campaign, fetchedTitle: content.title };
            } catch (err) {
              console.error('Failed to fetch title for', campaign.id, err);
              return campaign;
            }
          }

          return campaign;
        })
      );
      setCampaignsWithTitles(updatedCampaigns);
    };

    fetchTitles();
  }, [data]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-600 dark:text-red-400">
          Error loading campaigns: {error.message}
        </p>
      </div>
    );
  }

  const campaigns = (data as any)?.campaigns || [];

  if (campaigns.length === 0 && campaignsWithTitles.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No campaigns yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You haven't created any campaigns yet. Start your first campaign to raise funds for your project.
          </p>
          <Link
            href="/new-project"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Create Campaign
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {(campaignsWithTitles.length > 0 ? campaignsWithTitles : campaigns).map((campaign: any) => {
        const category = CATEGORIES.find((c) => c.id === campaign.category);
        const progress = (parseFloat(campaign.amountRaised) / parseFloat(campaign.amountSought)) * 100;
        const endDate = campaign.endDate ? new Date(parseInt(campaign.endDate) * 1000) : null;
        const isEnded = endDate ? endDate < new Date() : !campaign.campaignRunning;

        // Use fetchedTitle if content.title is not available
        const displayTitle = campaign.content?.title || campaign.fetchedTitle || campaign.title || 'Untitled Campaign';

        return (
          <div
            key={campaign.id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{category?.icon}</span>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {category?.name}
                  </span>
                  {isEnded && (
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-medium rounded">
                      Ended
                    </span>
                  )}
                  {campaign.campaignRunning && !isEnded && (
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-medium rounded">
                      Active
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {displayTitle}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{campaign.backers} backers</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Created {formatDistanceToNow(new Date(parseInt(campaign.dateCreated) * 1000), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/projects/${campaign.contractAddress || campaign.id}`}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="View Campaign"
                >
                  <ExternalLink className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </Link>
                <Link
                  href={`/projects/${campaign.contractAddress || campaign.id}/manage`}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Manage Campaign"
                >
                  <Edit className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </Link>
              </div>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {(parseFloat(campaign.amountRaised) / 1e18).toFixed(4)} BNB
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  of {(parseFloat(campaign.amountSought) / 1e18).toFixed(2)} BNB
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {progress.toFixed(1)}% funded
              </div>
            </div>

            {/* Actions */}
            {campaign.campaignRunning && !isEnded && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Link
                  href={`/projects/${campaign.contractAddress || campaign.id}/manage`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Manage Campaign
                </Link>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
