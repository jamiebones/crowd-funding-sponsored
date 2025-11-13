import Link from 'next/link';
import { Campaign } from '@/types/campaign';
import { CATEGORIES } from '@/lib/constants';
import { formatEther } from 'viem';
import { Clock, Users } from 'lucide-react';

interface CampaignCardProps {
  campaign: Campaign;
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const category = CATEGORIES.find((c) => c.id === campaign.category);
  const progress = (
    (parseFloat(formatEther(BigInt(campaign.amountRaised))) /
      parseFloat(formatEther(BigInt(campaign.amountSought)))) *
    100
  ).toFixed(1);

  // Support both old and new schema structures, and fetched titles from Arweave
  const title = campaign.content?.title || (campaign as any).fetchedTitle || campaign.title || 'Untitled Campaign';

  return (
    <Link
      href={`/projects/${campaign.id}`}
      className="group block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-200 overflow-hidden hover:shadow-xl"
    >
      {/* Image placeholder */}
      <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="text-6xl">{category?.icon || '📦'}</div>
        {campaign.campaignRunning && (
          <div className="absolute top-4 left-4 bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
            Active
          </div>
        )}
        {category && (
          <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-gray-900 dark:text-white text-xs font-medium px-3 py-1 rounded-full">
            {category.name}
          </div>
        )}
      </div>

      <div className="p-6">
        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {title}
        </h3>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Progress
            </span>
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              {progress}%
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(parseFloat(progress), 100)}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Raised
            </p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {parseFloat(formatEther(BigInt(campaign.amountRaised))).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              BNB
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Goal
            </p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {parseFloat(formatEther(BigInt(campaign.amountSought))).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              BNB
            </p>
          </div>
        </div>

        {/* Backers & Milestones */}
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{campaign.backers} backers</span>
          </div>
          {campaign.milestone && campaign.milestone.length > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{campaign.milestone.length} milestones</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
