import { Campaign } from '@/types/campaign';
import { formatEther } from 'viem';
import { Target, Users, Clock, TrendingUp, ArrowDownLeft } from 'lucide-react';
import Link from 'next/link';
import { useAccount, useReadContract } from 'wagmi';
import { useState } from 'react';
import { WithdrawDonationModal } from './WithdrawDonationModal';
import CROWDFUNDING_ABI from '@/abis/CrowdFunding.json';

interface FundingProgressProps {
  campaign: Campaign;
  onRefetch?: () => void;
}

export function FundingProgress({ campaign, onRefetch }: FundingProgressProps) {
  const { address, isConnected } = useAccount();
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const raised = parseFloat(formatEther(BigInt(campaign.amountRaised)));
  const goal = parseFloat(formatEther(BigInt(campaign.amountSought)));
  const progress = (raised / goal) * 100;

  // Calculate time remaining
  const now = Date.now() / 1000;
  const endTime = campaign.endDate ? parseInt(campaign.endDate) : 0;
  const timeRemaining = endTime - now;
  const daysRemaining = Math.max(0, Math.floor(timeRemaining / 86400));
  const hoursRemaining = Math.max(0, Math.floor((timeRemaining % 86400) / 3600));

  // Read campaign ended status directly from blockchain for real-time accuracy
  const { data: campaignEndedOnChain } = useReadContract({
    address: (campaign.contractAddress || campaign.id) as `0x${string}`,
    abi: CROWDFUNDING_ABI.abi,
    functionName: 'campaignEnded',
  });

  // Use on-chain data if available, otherwise fall back to subgraph
  const isCampaignRunning = campaignEndedOnChain !== undefined 
    ? !campaignEndedOnChain 
    : campaign?.campaignRunning ?? true;

  // Check if user has donated to this campaign
  const { data: userDonation } = useReadContract({
    address: (campaign.contractAddress || campaign.id) as `0x${string}`,
    abi: CROWDFUNDING_ABI.abi,
    functionName: 'donors',
    args: [address],
    query: {
      enabled: !!address && isConnected,
    },
  });

  // Check campaign stats for approved milestones
  const { data: campaignStats } = useReadContract({
    address: (campaign.contractAddress || campaign.id) as `0x${string}`,
    abi: CROWDFUNDING_ABI.abi,
    functionName: 'getCampaignStats',
  });

  const approvedMilestones = campaignStats ? (campaignStats as any)[3] : 0;

  const hasDonated = userDonation ? BigInt(userDonation.toString()) > BigInt(0) : false;
  const canWithdraw = hasDonated && Number(approvedMilestones) < 3;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 sticky top-6">
      {/* Main Stats */}
      <div className="mb-6">
        <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {raised.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 4,
          })}{' '}
          <span className="text-2xl text-gray-500">BNB</span>
        </div>
        <div className="text-gray-600 dark:text-gray-400 mb-4">
          raised of {goal.toLocaleString()} BNB goal
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
          {progress.toFixed(1)}% funded
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
        <div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-sm">Backers</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {campaign.backers}
          </div>
        </div>

        {campaign.campaignRunning && daysRemaining > 0 && (
          <div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Time Left</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {daysRemaining}
              <span className="text-sm font-normal text-gray-500"> days</span>
            </div>
            {hoursRemaining > 0 && (
              <div className="text-xs text-gray-500">
                {hoursRemaining} hours
              </div>
            )}
          </div>
        )}

        {campaign.milestone && campaign.milestone.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
              <Target className="w-4 h-4" />
              <span className="text-sm">Milestones</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {campaign.milestone.length}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 mb-4">
        {isCampaignRunning ? (
          <Link
            href={`/projects/${campaign.contractAddress || campaign.id}/donate`}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-4 rounded-lg transition-colors shadow-lg shadow-blue-600/30"
          >
            <TrendingUp className="w-5 h-5" />
            Back This Campaign
          </Link>
        ) : (
          <div className="w-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-semibold px-6 py-4 rounded-lg text-center">
            Campaign Ended
          </div>
        )}

        {/* Withdraw Button for Donors */}
        {isConnected && canWithdraw && (
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            <ArrowDownLeft className="w-5 h-5" />
            Withdraw My Donation
          </button>
        )}
      </div>

      {/* Share Buttons */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Share this campaign
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              const url = window.location.href;
              const title = campaign.content?.title || campaign.title || 'Campaign';
              const text = `Check out this campaign: ${title}`;
              window.open(
                `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
                '_blank'
              );
            }}
            className="flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Twitter
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert('Link copied to clipboard!');
            }}
            className="flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg transition-colors text-sm"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Copy Link
          </button>
        </div>
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <WithdrawDonationModal
          campaignAddress={(campaign.contractAddress || campaign.id) as string}
          onClose={() => setShowWithdrawModal(false)}
          onSuccess={() => {
            // Refetch campaign data from subgraph
            if (onRefetch) {
              // Wait for subgraph to index the transaction
              setTimeout(() => {
                onRefetch();
              }, 5000); // Increased to 5 seconds for subgraph indexing
            } else {
              // Fallback to page reload if no refetch function
              window.location.reload();
            }
          }}
        />
      )}
    </div>
  );
}
