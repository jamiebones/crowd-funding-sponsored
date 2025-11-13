import Link from 'next/link';
import { Campaign } from '@/types/campaign';
import { CATEGORIES } from '@/lib/constants';
import { formatEther } from 'viem';
import { Clock, Users, Calendar } from 'lucide-react';

interface CampaignCardListProps {
  campaign: Campaign;
}

export function CampaignCardList({ campaign }: CampaignCardListProps) {
  const category = CATEGORIES.find((c) => c.id === campaign.category);
  const progress = (
    (parseFloat(formatEther(BigInt(campaign.amountRaised))) /
      parseFloat(formatEther(BigInt(campaign.amountSought)))) *
    100
  ).toFixed(1);

  const createdDate = new Date(parseInt(campaign.dateCreated) * 1000);

  return (
    <Link
      href={`/projects/${campaign.id}`}
      className="group block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-200 overflow-hidden hover:shadow-lg"
    >
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <div className="relative w-full md:w-64 h-48 md:h-auto bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <div className="text-5xl">{category?.icon || '📦'}</div>
          {campaign.campaignRunning && (
            <div className="absolute top-4 left-4 bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
              Active
            </div>
          )}
          {!campaign.campaignRunning && (
            <div className="absolute top-4 left-4 bg-gray-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
              Ended
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              {/* Category & Title */}
              <div className="flex items-center gap-2 mb-2">
                {category && (
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                    {category.name}
                  </span>
                )}
                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {createdDate.toLocaleDateString()}
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {campaign.content?.title || (campaign as any).fetchedTitle || campaign.title || 'Untitled Campaign'}
              </h3>

              {/* Stats Row */}
              <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400 mb-4">
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

            {/* Funding Stats */}
            <div className="md:text-right md:min-w-[200px]">
              <div className="mb-2">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {parseFloat(formatEther(BigInt(campaign.amountRaised))).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  <span className="text-sm font-normal text-gray-500">BNB</span>
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  of {parseFloat(formatEther(BigInt(campaign.amountSought))).toLocaleString()} BNB goal
                </p>
              </div>

              {/* Progress percentage */}
              <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-sm font-semibold">
                {progress}% funded
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(parseFloat(progress), 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
