import Link from 'next/link';
import { Campaign } from '@/types/campaign';
import { CATEGORIES } from '@/lib/constants';
import { formatEther } from 'viem';
import { Clock, Users, TrendingUp, Target } from 'lucide-react';

interface CampaignCardProps {
  campaign: Campaign;
}

// Category gradients for visual variety
const categoryGradients: Record<number, string> = {
  0: 'from-blue-500 via-blue-600 to-cyan-600', // Technology
  1: 'from-pink-500 via-rose-500 to-orange-500', // Arts
  2: 'from-emerald-500 via-green-500 to-teal-500', // Community
  3: 'from-indigo-500 via-purple-500 to-violet-500', // Education
  4: 'from-green-500 via-emerald-500 to-lime-500', // Environment
  5: 'from-red-500 via-rose-500 to-pink-500', // Health
  6: 'from-amber-500 via-orange-500 to-yellow-500', // Social
  7: 'from-purple-500 via-violet-500 to-indigo-500', // Charity
  8: 'from-slate-500 via-gray-500 to-zinc-500', // Other
};

export function CampaignCard({ campaign }: CampaignCardProps) {
  const category = CATEGORIES.find((c) => c.id === campaign.category);
  
  // Handle null/undefined/zero amountRaised - ensure we safely convert to BigInt
  const amountRaisedBigInt = campaign.amountRaised && campaign.amountRaised !== '0' 
    ? BigInt(campaign.amountRaised) 
    : BigInt(0);
  const amountSoughtBigInt = BigInt(campaign.amountSought);
  
  const raisedEther = parseFloat(formatEther(amountRaisedBigInt));
  const soughtEther = parseFloat(formatEther(amountSoughtBigInt));
  
  const progressPercent = (raisedEther / soughtEther) * 100;
  const progress = progressPercent.toFixed(1);

  // Support both old and new schema structures, and fetched titles from Arweave
  const title = campaign.content?.title || (campaign as any).fetchedTitle || campaign.title || 'Untitled Campaign';

  // Determine if campaign is actually running based on endDate
  const now = Math.floor(Date.now() / 1000);
  const endTime = campaign.endDate ? parseInt(campaign.endDate) : 0;
  const isActuallyRunning = campaign.campaignRunning && (endTime === 0 || now < endTime);
  
  const gradient = categoryGradients[campaign.category] || categoryGradients[8];

  return (
    <Link
      href={`/projects/${campaign.id}`}
      className="group block bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700 hover:border-transparent transition-all duration-300 overflow-hidden hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1"
    >
      {/* Image with gradient */}
      <div className={`relative h-52 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
        {/* Animated pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:20px_20px]" />
        
        {/* Glow effects */}
        <div className="absolute -top-12 -right-12 w-24 h-24 bg-white/20 rounded-full blur-2xl" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
        
        {/* Category icon */}
        <div className="relative text-7xl transform group-hover:scale-110 transition-transform duration-300">
          {category?.icon || '📦'}
        </div>
        
        {/* Status badge */}
        {isActuallyRunning ? (
          <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-green-500/90 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            Active
          </div>
        ) : (
          <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-slate-500/90 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
            Ended
          </div>
        )}
        
        {/* Category tag */}
        {category && (
          <div className="absolute top-4 right-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm text-gray-900 dark:text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
            {category.name}
          </div>
        )}
        
        {/* Progress indicator at bottom of image */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/20">
          <div
            className="h-full bg-white/90 transition-all duration-500"
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
      </div>

      <div className="p-6">
        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors min-h-[3.5rem]">
          {title}
        </h3>

        {/* Progress section */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              Progress
            </span>
            <span className={`text-sm font-bold ${progressPercent >= 100 ? 'text-green-500' : 'text-blue-600 dark:text-blue-400'}`}>
              {progress}%
            </span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                progressPercent >= 100 
                  ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500'
              }`}
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-1">
              <TrendingUp className="w-3.5 h-3.5" />
              Raised
            </div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {raisedEther.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 4,
              })}{' '}
              <span className="text-xs font-medium text-gray-500">BNB</span>
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-1">
              <Target className="w-3.5 h-3.5" />
              Goal
            </div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {soughtEther.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              <span className="text-xs font-medium text-gray-500">BNB</span>
            </p>
          </div>
        </div>

        {/* Footer with backers & milestones */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
            <Users className="w-4 h-4" />
            <span className="font-medium">{campaign.backers}</span>
            <span>backers</span>
          </div>
          {campaign.milestone && campaign.milestone.length > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              <span className="font-medium">{campaign.milestone.length}</span>
              <span>milestone{campaign.milestone.length > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
