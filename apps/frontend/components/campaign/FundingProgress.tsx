import { Campaign } from '@/types/campaign';
import { formatEther } from 'viem';
import { Target, Users, Clock, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface FundingProgressProps {
  campaign: Campaign;
}

export function FundingProgress({ campaign }: FundingProgressProps) {
  const raised = parseFloat(formatEther(BigInt(campaign.amountRaised)));
  const goal = parseFloat(formatEther(BigInt(campaign.amountSought)));
  const progress = (raised / goal) * 100;

  // Calculate time remaining
  const now = Date.now() / 1000;
  const endTime = campaign.dateEnded ? parseInt(campaign.dateEnded) : 0;
  const timeRemaining = endTime - now;
  const daysRemaining = Math.max(0, Math.floor(timeRemaining / 86400));
  const hoursRemaining = Math.max(0, Math.floor((timeRemaining % 86400) / 3600));

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

      {/* Donate Button */}
      {campaign.campaignRunning ? (
        <Link
          href={`/projects/${campaign.id}/donate`}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-4 rounded-lg transition-colors shadow-lg shadow-blue-600/30 mb-4"
        >
          <TrendingUp className="w-5 h-5" />
          Back This Campaign
        </Link>
      ) : (
        <div className="w-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-semibold px-6 py-4 rounded-lg text-center mb-4">
          Campaign Ended
        </div>
      )}

      {/* Share Buttons */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Share this campaign
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              const url = window.location.href;
              const text = `Check out this campaign: ${campaign.title}`;
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
    </div>
  );
}
