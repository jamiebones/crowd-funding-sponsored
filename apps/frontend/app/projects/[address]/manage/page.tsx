'use client';

import { useParams, useRouter } from 'next/navigation';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useQuery } from '@apollo/client/react';
import { GET_CAMPAIGN_MANAGE_DATA } from '@/lib/queries/campaign-manage';
import { Campaign } from '@/types/campaign';
import { useState, useEffect } from 'react';
import { formatEther } from 'viem';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  Users,
  TrendingUp,
  Target,
  Calendar,
  Plus,
  DollarSign,
  XCircle,
  Settings,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { CATEGORIES, MILESTONE_STATUS } from '@/lib/constants';
import { addressToSubgraphId, subgraphIdToAddress } from '@/lib/utils';
import CROWD_FUNDING_CONTRACT from '@/abis/CrowdFunding.json';

const CROWD_FUNDING_ABI = CROWD_FUNDING_CONTRACT.abi;

export default function CampaignManagePage() {
  const params = useParams();
  const router = useRouter();
  const addressParam = params.address as string;
  const { address: walletAddress, isConnected } = useAccount();

  // Convert address to subgraph ID format if it looks like a normal address
  const campaignId = addressParam.startsWith('0x') && addressParam.length === 42
    ? addressToSubgraphId(addressParam.toLowerCase())
    : addressParam.toLowerCase();

  // Get the actual contract address for blockchain interactions
  const contractAddress = addressParam.startsWith('0x') && addressParam.length === 42
    ? addressParam
    : subgraphIdToAddress(addressParam);

  const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null);
  const [showEndCampaignModal, setShowEndCampaignModal] = useState(false);
  const [campaignTitle, setCampaignTitle] = useState<string>('');

  const { data, loading, error, refetch } = useQuery(GET_CAMPAIGN_MANAGE_DATA, {
    variables: { id: campaignId },
    skip: !addressParam,
  });

  const campaign: Campaign | undefined = (data as any)?.campaign;

  // Fetch campaign title from Arweave if not in subgraph
  useEffect(() => {
    if (campaign && !campaign.content?.title && campaign.campaignCID) {
      const abortController = new AbortController();
      
      fetch(`https://arweave.net/${campaign.campaignCID}`, {
        signal: abortController.signal,
      })
        .then((res) => res.json())
        .then((content) => {
          if (content.title) {
            setCampaignTitle(content.title);
          }
        })
        .catch((err) => {
          if (err.name !== 'AbortError') {
            console.error('Failed to fetch campaign title:', err);
          }
        });

      return () => {
        abortController.abort();
      };
    }
  }, [campaign]);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Redirect if not connected
  useEffect(() => {
    if (!isConnected) {
      router.push(`/projects/${addressParam}`);
    }
  }, [isConnected, router, addressParam]);

  // Check ownership
  useEffect(() => {
    if (campaign && walletAddress) {
      if (campaign.owner.id.toLowerCase() !== walletAddress.toLowerCase()) {
        router.push(`/projects/${addressParam}`);
      }
    }
  }, [campaign, walletAddress, router, addressParam]);

  // Refetch on success
  useEffect(() => {
    if (isSuccess) {
      refetch();
      setSelectedMilestone(null);
      setShowEndCampaignModal(false);
    }
  }, [isSuccess, refetch]);

  const handleWithdrawMilestone = (milestoneId: string) => {
    writeContract({
      address: contractAddress as `0x${string}`,
      abi: CROWD_FUNDING_ABI,
      functionName: 'withdrawMilestone',
    });
  };

  const handleEndCampaign = () => {
    writeContract({
      address: contractAddress as `0x${string}`,
      abi: CROWD_FUNDING_ABI,
      functionName: 'endCampaign',
    });
  };

  if (!isConnected) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-600 dark:text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {error ? 'Error loading campaign' : 'Campaign not found'}
          </h1>
          <Link
            href="/dashboard"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to Dashboard
          </Link>
          <Link
            href={`/projects/${addressParam}`}
            className="ml-4 text-blue-600 dark:text-blue-400 hover:underline"
          >
            View Campaign
          </Link>
        </div>
      </div>
    );
  }

  const categoryInfo = CATEGORIES.find((cat) => cat.id === campaign.category);
  const raised = parseFloat(formatEther(BigInt(campaign.amountRaised)));
  const goal = parseFloat(formatEther(BigInt(campaign.amountSought)));
  const progress = (raised / goal) * 100;

  const approvedMilestones = campaign.milestone?.filter(
    (m) => m.status === MILESTONE_STATUS.APPROVED
  ) || [];
  const pendingMilestones = campaign.milestone?.filter(
    (m) => m.status === MILESTONE_STATUS.PENDING
  ) || [];
  const canCreateMilestone = (campaign.milestone?.length || 0) < 3;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/projects/${addressParam}`}
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Campaign
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="text-5xl">{categoryInfo?.icon || '📦'}</div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {campaignTitle || campaign.content?.title || campaign.title || 'Untitled Campaign'}
                </h1>
                <div className="flex items-center gap-2">
                  <span className={`
                    px-3 py-1 rounded-full text-sm font-medium
                    ${campaign.campaignRunning
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}
                  `}>
                    {campaign.campaignRunning ? 'Active' : 'Ended'}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Campaign ID: {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
                  </span>
                </div>
              </div>
            </div>

            <Link
              href={`/projects/${addressParam}`}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View Public Page
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Raised</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {raised.toFixed(4)} BNB
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {progress.toFixed(1)}% of goal
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Backers</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {campaign.backers}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {campaign.donations?.length || 0} donations
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Milestones</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {campaign.milestone?.length || 0} / 3
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {approvedMilestones.length} approved
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Created</span>
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {new Date(parseInt(campaign.dateCreated) * 1000).toLocaleDateString()}
            </div>
            {campaign.dateEnded && (
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Ends: {new Date(parseInt(campaign.dateEnded) * 1000).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Milestones & Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Milestones Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Milestones
                </h2>
                {canCreateMilestone && campaign.campaignRunning && (
                  <Link
                    href={`/projects/${addressParam}/milestone/new`}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create Milestone
                  </Link>
                )}
              </div>

              {campaign.milestone && campaign.milestone.length > 0 ? (
                <div className="space-y-4">
                  {campaign.milestone.map((milestone, index) => {
                    const statusInfo = {
                      [MILESTONE_STATUS.DEFAULT]: { label: 'Not Submitted', color: 'gray' },
                      [MILESTONE_STATUS.PENDING]: { label: 'Voting', color: 'blue' },
                      [MILESTONE_STATUS.APPROVED]: { label: 'Approved', color: 'green' },
                      [MILESTONE_STATUS.DECLINED]: { label: 'Declined', color: 'red' },
                    };
                    const status = statusInfo[milestone.status as keyof typeof statusInfo];
                    const canWithdraw = milestone.status === MILESTONE_STATUS.APPROVED;

                    return (
                      <div
                        key={milestone.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-gray-900 dark:text-white">
                                Milestone {index + 1}
                              </span>
                              <span className={`
                                px-2 py-0.5 rounded text-xs font-medium
                                ${status.color === 'green' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                                  status.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                                  status.color === 'red' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                                  'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}
                              `}>
                                {status.label}
                              </span>
                            </div>
                            
                            {milestone.status === MILESTONE_STATUS.PENDING && milestone.periodToVote && (
                              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                Voting ends: {new Date(parseInt(milestone.periodToVote) * 1000).toLocaleDateString()}
                              </div>
                            )}

                            {milestone.status !== MILESTONE_STATUS.DEFAULT && (
                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-green-600 dark:text-green-400">
                                  For: {(milestone as any).votesFor || 0}
                                </span>
                                <span className="text-red-600 dark:text-red-400">
                                  Against: {(milestone as any).votesAgainst || 0}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Link
                              href={`/projects/${addressParam}/milestone/${milestone.id}`}
                              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded text-sm transition-colors"
                            >
                              View
                            </Link>
                            
                            {canWithdraw && (
                              <button
                                onClick={() => handleWithdrawMilestone(milestone.id)}
                                disabled={isPending || isConfirming}
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded text-sm transition-colors"
                              >
                                {isPending || isConfirming ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <DollarSign className="w-3 h-3" />
                                )}
                                Withdraw
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    No milestones created yet
                  </p>
                  {canCreateMilestone && campaign.campaignRunning && (
                    <Link
                      href={`/projects/${addressParam}/milestone/new`}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                      Create First Milestone
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Campaign Actions */}
            {campaign.campaignRunning && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Campaign Actions
                </h2>
                
                <button
                  onClick={() => setShowEndCampaignModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  End Campaign Early
                </button>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Ending the campaign early will stop all donations and prevent new milestones.
                </p>
              </div>
            )}
          </div>

          {/* Right Column - Donors List */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Recent Donors
              </h2>

              {campaign.donations && campaign.donations.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {campaign.donations.slice(0, 10).map((donation: any) => (
                    <div
                      key={donation.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/user/${donation.donor.id}`}
                          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline truncate block"
                        >
                          {donation.donor.id.slice(0, 6)}...{donation.donor.id.slice(-4)}
                        </Link>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(parseInt(donation.timestamp) * 1000).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        {(parseFloat(formatEther(BigInt(donation.amount)))).toFixed(4)} BNB
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    No donations yet
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* End Campaign Modal */}
        {showEndCampaignModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                End Campaign Early?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to end this campaign early? This action cannot be undone.
                Donors will still be able to withdraw their contributions.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEndCampaignModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEndCampaign}
                  disabled={isPending || isConfirming}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  {isPending || isConfirming ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    'End Campaign'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
