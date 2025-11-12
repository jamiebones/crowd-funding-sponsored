import { Campaign } from '@/types/campaign';
import { CATEGORIES } from '@/lib/constants';
import { Calendar, User, ExternalLink, Settings } from 'lucide-react';
import Link from 'next/link';
import { useAccount } from 'wagmi';

interface CampaignHeaderProps {
  campaign: Campaign;
}

export function CampaignHeader({ campaign }: CampaignHeaderProps) {
  const { address: walletAddress } = useAccount();
  const category = CATEGORIES.find((c) => c.id === campaign.category);
  const createdDate = new Date(parseInt(campaign.dateCreated) * 1000);
  const isOwner = walletAddress && campaign.owner.id.toLowerCase() === walletAddress.toLowerCase();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 md:p-8">
      {/* Breadcrumb and Manage Button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400">
            Home
          </Link>
          <span>/</span>
          <Link href="/projects" className="hover:text-blue-600 dark:hover:text-blue-400">
            Projects
          </Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">Campaign</span>
        </div>
        
        {isOwner && (
          <Link
            href={`/projects/${campaign.id}/manage`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
            Manage Campaign
          </Link>
        )}
      </div>

      {/* Category and Status */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {category && (
          <span className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full">
            <span className="text-lg">{category.icon}</span>
            {category.name}
          </span>
        )}
        {campaign.campaignRunning ? (
          <span className="inline-flex items-center gap-2 bg-green-500 text-white text-sm font-semibold px-3 py-1 rounded-full">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            Active
          </span>
        ) : (
          <span className="bg-gray-500 text-white text-sm font-semibold px-3 py-1 rounded-full">
            Ended
          </span>
        )}
      </div>

      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
        {campaign.title}
      </h1>

      {/* Meta Info */}
      <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>Created {createdDate.toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <User className="w-4 h-4" />
          <span>By</span>
          <Link
            href={`/user/${campaign.owner.id}`}
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            {campaign.owner.id.slice(0, 6)}...{campaign.owner.id.slice(-4)}
          </Link>
        </div>
        <a
          href={`${process.env.NEXT_PUBLIC_BLOCK_EXPLORER}/address/${campaign.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
        >
          <span>View Contract</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
