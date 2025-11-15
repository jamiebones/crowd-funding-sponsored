'use client';

import { useParams, useRouter } from 'next/navigation';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { useQuery } from '@apollo/client/react';
import { GET_CAMPAIGN_MANAGE_DATA } from '@/lib/queries/campaign-manage';
import { Campaign } from '@/types/campaign';
import { useState, useEffect } from 'react';
import { formatEther } from 'viem';
import Link from 'next/link';
import { toast } from 'sonner';
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
import { filterActiveDonations } from '@/lib/filterActiveDonations';
import CROWD_FUNDING_CONTRACT from '@/abis/CrowdFunding.json';

const CROWD_FUNDING_ABI = CROWD_FUNDING_CONTRACT.abi;

export default function CampaignManagePage() {
  const params = useParams();
  const router = useRouter();
  const addressParam = params.address as string;
  const { address: walletAddress, isConnected } = useAccount();

  // Use the address directly as campaign ID (lowercased for consistency)
  const campaignId = addressParam.toLowerCase();

  // The contract address is the same as the campaign ID
  const contractAddress = addressParam;

  const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null);
  const [showEndCampaignModal, setShowEndCampaignModal] = useState(false);
  const [showExtendDurationModal, setShowExtendDurationModal] = useState(false);
  const [showVotingPeriodModal, setShowVotingPeriodModal] = useState(false);
  const [newDuration, setNewDuration] = useState<number>(30);
  const [votingPeriodDays, setVotingPeriodDays] = useState<number>(14);
  const [campaignTitle, setCampaignTitle] = useState<string>('');

  const { data, loading, error, refetch } = useQuery(GET_CAMPAIGN_MANAGE_DATA, {
    variables: { id: campaignId },
    skip: !addressParam,
  });

  const campaign: Campaign | undefined = (data as any)?.campaign;

  // Read campaign ended status directly from blockchain for real-time accuracy
  const { data: campaignEndedOnChain, refetch: refetchCampaignStatus } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: CROWD_FUNDING_ABI,
    functionName: 'campaignEnded',
  });

  // Use on-chain data if available, otherwise fall back to subgraph
  const isCampaignRunning = campaignEndedOnChain !== undefined 
    ? !campaignEndedOnChain 
    : campaign?.campaignRunning ?? true;

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

  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error: txError } = useWaitForTransactionReceipt({
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
      refetchCampaignStatus();
      setSelectedMilestone(null);
      toast.success('Transaction confirmed successfully!');
    }
  }, [isSuccess, refetch, refetchCampaignStatus]);

  // Show transaction pending state
  useEffect(() => {
    if (isPending) {
      toast.loading('Waiting for wallet confirmation...', { id: 'tx-pending' });
    } else {
      toast.dismiss('tx-pending');
    }
  }, [isPending]);

  // Show transaction confirming state
  useEffect(() => {
    if (isConfirming) {
      toast.loading('Transaction confirming on blockchain...', { id: 'tx-confirming' });
    } else {
      toast.dismiss('tx-confirming');
    }
  }, [isConfirming]);

  // Handle transaction errors
  useEffect(() => {
    if (writeError) {
      toast.dismiss('tx-pending');
      toast.dismiss('tx-confirming');
      
      const errorMessage = writeError.message || 'Transaction failed';
      
      // Check for specific error patterns
      if (errorMessage.includes('User rejected') || errorMessage.includes('User denied')) {
        toast.error('Transaction rejected by user');
      } else if (errorMessage.includes('insufficient funds')) {
        toast.error('Insufficient funds for transaction');
      } else if (errorMessage.includes('CampaignAlreadyEnded')) {
        toast.error('Campaign has already ended');
      } else if (errorMessage.includes('Only owner')) {
        toast.error('Only campaign owner can perform this action');
      } else {
        toast.error('Transaction failed: ' + errorMessage.substring(0, 100));
      }
      
      console.error('Write error:', writeError);
    }
  }, [writeError]);

  useEffect(() => {
    if (txError) {
      toast.dismiss('tx-confirming');
      toast.error('Transaction failed on blockchain');
      console.error('Transaction error:', txError);
    }
  }, [txError]);

  // Handle transaction errors (legacy)
  useEffect(() => {
    if (hash && !isConfirming && !isSuccess) {
      const checkError = async () => {
        // Wait a bit to see if transaction fails
        await new Promise(resolve => setTimeout(resolve, 2000));
        if (!isSuccess && !isConfirming) {
          toast.error('Transaction failed. Please try again.');
        }
      };
      checkError();
    }
  }, [hash, isConfirming, isSuccess]);

  const handleWithdrawMilestone = (milestoneId: string) => {
    try {
      writeContract({
        address: contractAddress as `0x${string}`,
        abi: CROWD_FUNDING_ABI,
        functionName: 'withdrawMilestone',
      });
      toast.info('Initiating milestone withdrawal...');
    } catch (error) {
      toast.error('Failed to initiate withdrawal');
      console.error(error);
    }
  };

  const handleEndCampaign = () => {
    setShowEndCampaignModal(false); // Close modal immediately
    
    // Check if campaign is already ended using real-time on-chain data
    if (!isCampaignRunning) {
      toast.error('Campaign has already ended');
      return;
    }
    
    // Check if user is the owner
    if (campaign?.owner.id.toLowerCase() !== walletAddress?.toLowerCase()) {
      toast.error('Only the campaign owner can end the campaign');
      return;
    }
    
    try {
      writeContract({
        address: contractAddress as `0x${string}`,
        abi: CROWD_FUNDING_ABI,
        functionName: 'endCampaign',
      });
      toast.info('Ending campaign...');
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to end campaign';
      toast.error(errorMessage);
      console.error('End campaign error:', error);
    }
  };

  const handleExtendDuration = () => {
    setShowExtendDurationModal(false); // Close modal immediately
    
    try {
      // Calculate new timestamp (current time + additional days)
      const additionalSeconds = newDuration * 24 * 60 * 60;
      const newTimestamp = Math.floor(Date.now() / 1000) + additionalSeconds;
      
      writeContract({
        address: contractAddress as `0x${string}`,
        abi: CROWD_FUNDING_ABI,
        functionName: 'increaseCampaignPeriod',
        args: [BigInt(newTimestamp)],
      });
      toast.info(`Extending campaign by ${newDuration} days...`);
    } catch (error) {
      toast.error('Failed to extend campaign duration');
      console.error(error);
    }
  };

  const handleSetVotingPeriod = () => {
    setShowVotingPeriodModal(false); // Close modal immediately
    
    // Validation
    if (votingPeriodDays < 1 || votingPeriodDays > 90) {
      toast.error('Voting period must be between 1 and 90 days');
      return;
    }
    
    // Check if campaign is already ended
    if (!isCampaignRunning) {
      toast.error('Cannot change voting period after campaign ends');
      return;
    }
    
    try {
      writeContract({
        address: contractAddress as `0x${string}`,
        abi: CROWD_FUNDING_ABI,
        functionName: 'setVotingPeriod',
        args: [BigInt(votingPeriodDays)],
      });
      toast.info(`Setting voting period to ${votingPeriodDays} days...`);
    } catch (error) {
      toast.error('Failed to set voting period');
      console.error(error);
    }
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
                    ${isCampaignRunning
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}
                  `}>
                    {isCampaignRunning ? 'Active' : 'Ended'}
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
            {campaign.endDate && (
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Ends: {new Date(parseInt(campaign.endDate) * 1000).toLocaleDateString()}
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
                {canCreateMilestone && isCampaignRunning && (
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
                    
                    // First milestone can be withdrawn if campaign ended and status is PENDING
                    // Subsequent milestones can only be withdrawn after voting approval (PENDING with voting ended or APPROVED)
                    const isFirstMilestone = index === 0;
                    const votingEnded = milestone.periodToVote ? Date.now() > parseInt(milestone.periodToVote) * 1000 : false;
                    
                    const canWithdraw = 
                      (isFirstMilestone && milestone.status === MILESTONE_STATUS.PENDING && !isCampaignRunning) ||
                      (milestone.status === MILESTONE_STATUS.PENDING && votingEnded) ||
                      (milestone.status === MILESTONE_STATUS.APPROVED);

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
                                {index === 0 && isCampaignRunning && (
                                  <span className="block text-xs mt-1">
                                    💡 First milestone can be withdrawn once campaign ends (no voting required)
                                  </span>
                                )}
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
                            
                            {canWithdraw ? (
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
                            ) : milestone.status === MILESTONE_STATUS.PENDING && !votingEnded ? (
                              <div className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded text-sm cursor-not-allowed" title="Wait for voting period to end">
                                Voting in progress
                              </div>
                            ) : milestone.status === MILESTONE_STATUS.DECLINED ? (
                              <div className="px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded text-sm">
                                Declined
                              </div>
                            ) : null}
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
                  {canCreateMilestone && isCampaignRunning && (
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
            {isCampaignRunning && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Campaign Actions
                </h2>
                
                <div className="space-y-3">
                  <button
                    onClick={() => setShowExtendDurationModal(true)}
                    className="w-full flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Calendar className="w-4 h-4" />
                    Extend Campaign Duration
                  </button>
                  
                  <button
                    onClick={() => setShowVotingPeriodModal(true)}
                    className="w-full flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Set Voting Period
                  </button>
                  
                  <button
                    onClick={() => setShowEndCampaignModal(true)}
                    className="w-full flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    End Campaign Early
                  </button>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                  Extend the campaign duration to give more time for fundraising, or end it early to stop all donations.
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

              {(() => {
                const allDonations = campaign.donations || [];
                const withdrawals = campaign.donorsRecall || [];
                
                // Filter out donations from users who have withdrawn
                const activeDonations = filterActiveDonations(allDonations, withdrawals);

                return activeDonations.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {activeDonations.slice(0, 10).map((donation: any) => (
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
                      No active donors
                    </p>
                  </div>
                );
              })()}
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

        {/* Extend Duration Modal */}
        {showExtendDurationModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Extend Campaign Duration
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Add more time to your campaign to continue accepting donations.
              </p>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Additional Days
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={newDuration}
                  onChange={(e) => setNewDuration(parseInt(e.target.value) || 30)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter number of days"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Campaign can be extended up to 1 year from now
                </p>
              </div>

              {campaign.endDate && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Current end date: {new Date(parseInt(campaign.endDate) * 1000).toLocaleDateString()}
                  </p>
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-1">
                    New end date: {new Date(Date.now() + newDuration * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowExtendDurationModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExtendDuration}
                  disabled={isPending || isConfirming || !newDuration || newDuration < 1}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  {isPending || isConfirming ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    'Extend Duration'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Set Voting Period Modal */}
        {showVotingPeriodModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Set Voting Period
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Configure how long donors have to vote on milestones. This applies to all future milestones.
              </p>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Voting Period (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={votingPeriodDays}
                  onChange={(e) => setVotingPeriodDays(parseInt(e.target.value) || 14)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter number of days (1-90)"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Voting period must be between 1 and 90 days
                </p>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Current voting period:</strong> 14 days (default)
                </p>
                <p className="text-sm font-semibold text-purple-600 dark:text-purple-400 mt-1">
                  New voting period: {votingPeriodDays} day{votingPeriodDays !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                  ⚠️ This setting applies to all future milestones. Existing milestone voting periods remain unchanged.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowVotingPeriodModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSetVotingPeriod}
                  disabled={isPending || isConfirming || !votingPeriodDays || votingPeriodDays < 1 || votingPeriodDays > 90}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  {isPending || isConfirming ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    'Set Period'
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
