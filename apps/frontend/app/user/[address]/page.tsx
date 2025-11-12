'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@apollo/client/react';
import { GET_USER_PROFILE } from '@/lib/queries/user-profile';
import { formatEther } from 'viem';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { 
  Copy, 
  ExternalLink, 
  Rocket, 
  Heart, 
  Vote, 
  TrendingUp,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useState } from 'react';
import { CATEGORY_LABELS } from '@/lib/constants';

const BLOCK_EXPLORER = process.env.NEXT_PUBLIC_BLOCK_EXPLORER || 'https://testnet.bscscan.com';

export default function UserProfilePage() {
  const params = useParams();
  const address = params?.address as string;
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'donations'>('campaigns');

  const { data, loading, error } = useQuery(GET_USER_PROFILE, {
    variables: { address: address?.toLowerCase() },
    skip: !address,
  });

  const campaignCreator = (data as any)?.campaignCreator;
  const donor = (data as any)?.donor;

  // Calculate statistics
  const totalCampaignsCreated = campaignCreator?.totalCampaignsCreated || 0;
  const campaigns = campaignCreator?.campaigns || [];
  const activeCampaigns = campaigns.filter((c: any) => c.campaignRunning).length;
  const endedCampaigns = campaigns.filter((c: any) => !c.campaignRunning).length;
  
  const totalRaised = campaigns.reduce((sum: bigint, campaign: any) => {
    return sum + BigInt(campaign.amountRaised);
  }, BigInt(0));

  const totalDonated = donor?.totalDonated || '0';
  const totalWithdrawn = donor?.totalWithdrawn || '0';
  const netDonated = BigInt(totalDonated) - BigInt(totalWithdrawn);
  const donations = donor?.donations || [];
  const votes = donor?.votes || [];

  // Shorten address display
  const shortenAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Copy address to clipboard
  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  // Get category label
  const getCategoryLabel = (category: number): string => {
    return CATEGORY_LABELS[category] || 'Other';
  };

  // Calculate funding percentage
  const getFundingPercentage = (raised: string, goal: string): number => {
    const raisedBigInt = BigInt(raised);
    const goalBigInt = BigInt(goal);
    if (goalBigInt === BigInt(0)) return 0;
    return Number((raisedBigInt * BigInt(10000)) / goalBigInt) / 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Error Loading Profile
          </h2>
          <p className="text-gray-600 dark:text-gray-400">{error.message}</p>
        </div>
      </div>
    );
  }

  // Check if user has any activity
  const hasActivity = totalCampaignsCreated > 0 || donations.length > 0 || votes.length > 0;

  if (!hasActivity) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Address Header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  User Profile
                </h1>
                <div className="flex items-center gap-3">
                  <code className="text-sm bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded">
                    {shortenAddress(address)}
                  </code>
                  <button
                    onClick={copyAddress}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    title="Copy address"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  {copiedAddress && (
                    <span className="text-sm text-green-600">Copied!</span>
                  )}
                  <a
                    href={`${BLOCK_EXPLORER}/address/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    title="View on block explorer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Empty State */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
                <Rocket className="h-10 w-10 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                No Activity Yet
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                This user hasn't created any campaigns or made any donations yet.
              </p>
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Explore Campaigns
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Address Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                User Profile
              </h1>
              <div className="flex items-center gap-3">
                <code className="text-sm bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded">
                  {shortenAddress(address)}
                </code>
                <button
                  onClick={copyAddress}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  title="Copy address"
                >
                  <Copy className="h-4 w-4" />
                </button>
                {copiedAddress && (
                  <span className="text-sm text-green-600 dark:text-green-400">Copied!</span>
                )}
                <a
                  href={`${BLOCK_EXPLORER}/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  title="View on block explorer"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Campaigns Created */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Campaigns Created</span>
              <Rocket className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {totalCampaignsCreated}
            </p>
            <div className="mt-2 flex gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                {activeCampaigns} Active
              </span>
              <span className="flex items-center gap-1">
                <XCircle className="h-3 w-3 text-gray-400" />
                {endedCampaigns} Ended
              </span>
            </div>
          </div>

          {/* Total Raised */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Raised</span>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {parseFloat(formatEther(totalRaised)).toFixed(4)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">BNB</p>
          </div>

          {/* Total Donated */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Donated</span>
              <Heart className="h-5 w-5 text-red-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {parseFloat(formatEther(netDonated)).toFixed(4)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              BNB (Net of withdrawals)
            </p>
          </div>

          {/* Votes Cast */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Votes Cast</span>
              <Vote className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {votes.length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Milestone votes</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex gap-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('campaigns')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'campaigns'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Campaigns Created ({campaigns.length})
              </button>
              <button
                onClick={() => setActiveTab('donations')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'donations'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Donations ({donations.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Campaigns Tab */}
            {activeTab === 'campaigns' && (
              <div>
                {campaigns.length === 0 ? (
                  <div className="text-center py-12">
                    <Rocket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No campaigns created yet
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {campaigns.map((campaign: any) => {
                      const percentage = getFundingPercentage(
                        campaign.amountRaised,
                        campaign.amountSought
                      );

                      return (
                        <Link
                          key={campaign.id}
                          href={`/projects/${campaign.id}`}
                          className="block bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 flex-1">
                              {campaign.title}
                            </h3>
                            {campaign.campaignRunning ? (
                              <span className="ml-2 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full whitespace-nowrap">
                                Active
                              </span>
                            ) : (
                              <span className="ml-2 px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded-full whitespace-nowrap">
                                Ended
                              </span>
                            )}
                          </div>

                          <div className="mb-3">
                            <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                              {getCategoryLabel(campaign.category)}
                            </span>
                          </div>

                          <div className="mb-2">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600 dark:text-gray-400">Progress</span>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {percentage.toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-sm">
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Raised</p>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {parseFloat(formatEther(BigInt(campaign.amountRaised))).toFixed(2)} BNB
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-gray-600 dark:text-gray-400">Backers</p>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {campaign.backers}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <Calendar className="h-3 w-3" />
                            {formatDistanceToNow(new Date(Number(campaign.dateCreated) * 1000), {
                              addSuffix: true,
                            })}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Donations Tab */}
            {activeTab === 'donations' && (
              <div>
                {donations.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No donations made yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {donations.map((donation: any) => (
                      <Link
                        key={donation.id}
                        href={`/projects/${donation.campaign.id}`}
                        className="block bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                              {donation.campaign.title}
                            </h3>
                            <div className="flex items-center gap-4 text-sm">
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Donated: </span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {parseFloat(formatEther(BigInt(donation.amount))).toFixed(4)} BNB
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(Number(donation.dateCreated) * 1000), {
                                  addSuffix: true,
                                })}
                              </div>
                            </div>
                          </div>
                          <ArrowRight className="h-5 w-5 text-gray-400 flex-shrink-0 ml-4" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
