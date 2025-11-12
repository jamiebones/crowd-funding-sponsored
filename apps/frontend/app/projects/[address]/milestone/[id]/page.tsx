'use client';

import { useParams, useRouter } from 'next/navigation';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useQuery } from '@apollo/client/react';
import { GET_MILESTONE_DETAIL, GET_USER_DONATION } from '@/lib/queries/milestone-detail';
import { useState, useEffect } from 'react';
import { formatEther } from 'viem';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
  TrendingUp,
  ExternalLink,
  Image as ImageIcon,
  FileText,
} from 'lucide-react';
import { CATEGORIES, MILESTONE_STATUS } from '@/lib/constants';
import { formatDistanceToNow } from 'date-fns';
import CROWD_FUNDING_CONTRACT from '@/abis/CrowdFunding.json';

const CROWD_FUNDING_ABI = CROWD_FUNDING_CONTRACT.abi;

interface MilestoneContent {
  title: string;
  description: string;
  proofUrls: string[];
  createdAt: string;
}

export default function MilestoneDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignAddress = params.address as string;
  const milestoneId = params.id as string;
  const { address: walletAddress, isConnected } = useAccount();

  const [milestoneContent, setMilestoneContent] = useState<MilestoneContent | null>(null);
  const [loadingContent, setLoadingContent] = useState(true);
  const [voteType, setVoteType] = useState<boolean | null>(null);

  // Fetch milestone data
  const { data: milestoneData, loading: milestoneLoading, refetch } = useQuery(GET_MILESTONE_DETAIL, {
    variables: { id: milestoneId },
    skip: !milestoneId,
  });

  const milestone = (milestoneData as any)?.milestone;

  // Check if user has donated to this campaign
  const { data: donationData } = useQuery(GET_USER_DONATION, {
    variables: {
      donor: walletAddress?.toLowerCase(),
      campaign: campaignAddress?.toLowerCase(),
    },
    skip: !walletAddress || !campaignAddress,
  });

  const userDonations = (donationData as any)?.donations || [];
  const hasVotingPower = userDonations.length > 0;
  const votingPower = userDonations.reduce(
    (sum: number, d: any) => sum + parseFloat(d.amount),
    0
  );

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Fetch milestone content from Arweave
  useEffect(() => {
    if (milestone?.milestoneCID) {
      fetch(`https://arweave.net/${milestone.milestoneCID}`)
        .then((res) => res.json())
        .then((content) => {
          setMilestoneContent(content);
          setLoadingContent(false);
        })
        .catch((error) => {
          console.error('Error fetching milestone content:', error);
          setLoadingContent(false);
        });
    }
  }, [milestone?.milestoneCID]);

  // Refetch after successful vote
  useEffect(() => {
    if (isSuccess) {
      refetch();
      setVoteType(null);
    }
  }, [isSuccess, refetch]);

  const handleVote = (support: boolean) => {
    if (!hasVotingPower) {
      alert('You must donate to this campaign to vote');
      return;
    }

    setVoteType(support);

    writeContract({
      address: campaignAddress as `0x${string}`,
      abi: CROWD_FUNDING_ABI,
      functionName: 'voteOnMilestone',
      args: [support],
    });
  };

  if (milestoneLoading || loadingContent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading milestone...</p>
        </div>
      </div>
    );
  }

  if (!milestone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Milestone not found
          </h1>
          <Link
            href={`/projects/${campaignAddress}`}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Back to Campaign
          </Link>
        </div>
      </div>
    );
  }

  const campaign = milestone.campaign;
  const categoryInfo = CATEGORIES.find((cat) => cat.id === campaign.category);
  
  // Calculate vote percentages
  const totalVotes = parseFloat(milestone.votesFor) + parseFloat(milestone.votesAgainst);
  const forPercentage = totalVotes > 0 ? (parseFloat(milestone.votesFor) / totalVotes) * 100 : 0;
  const againstPercentage = totalVotes > 0 ? (parseFloat(milestone.votesAgainst) / totalVotes) * 100 : 0;
  const approvalThreshold = 66.67; // 2/3 majority

  // Check if voting period is active
  const votingDeadline = parseInt(milestone.periodToVote) * 1000;
  const now = Date.now();
  const isVotingActive = now < votingDeadline && milestone.status === MILESTONE_STATUS.PENDING;
  const timeRemaining = votingDeadline - now;

  // Check if user already voted
  const userVote = milestone.votes.find(
    (v: any) => v.voter.toLowerCase() === walletAddress?.toLowerCase()
  );

  // Status badge
  const getStatusBadge = () => {
    switch (milestone.status) {
      case MILESTONE_STATUS.PENDING:
        return (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <span className="font-semibold text-yellow-600 dark:text-yellow-400">Voting Active</span>
          </div>
        );
      case MILESTONE_STATUS.APPROVED:
        return (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="font-semibold text-green-600 dark:text-green-400">Approved</span>
          </div>
        );
      case MILESTONE_STATUS.DECLINED:
        return (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="font-semibold text-red-600 dark:text-red-400">Declined</span>
          </div>
        );
      default:
        return null;
    }
  };

  // Sort voters by weight
  const sortedVoters = [...milestone.votes].sort(
    (a: any, b: any) => parseFloat(b.weight) - parseFloat(a.weight)
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
          <Link href="/projects" className="hover:text-gray-900 dark:hover:text-white">
            Projects
          </Link>
          <span>/</span>
          <Link
            href={`/projects/${campaignAddress}`}
            className="hover:text-gray-900 dark:hover:text-white"
          >
            {campaign.title}
          </Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">Milestone</span>
        </div>

        {/* Back Button */}
        <Link
          href={`/projects/${campaignAddress}`}
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Campaign
        </Link>

        {/* Milestone Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-3xl">{categoryInfo?.icon || '📦'}</div>
                {getStatusBadge()}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {milestoneContent?.title || 'Loading...'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Created {formatDistanceToNow(new Date(parseInt(milestone.createdAt) * 1000))} ago
              </p>
            </div>
          </div>

          {/* Voting Countdown */}
          {isVotingActive && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="font-semibold text-gray-900 dark:text-white">
                  Voting ends in:
                </span>
              </div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatDistanceToNow(new Date(votingDeadline))}
              </p>
            </div>
          )}

          {!isVotingActive && milestone.status === MILESTONE_STATUS.PENDING && (
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <p className="text-gray-600 dark:text-gray-400">Voting period has ended</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Description
              </h2>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {milestoneContent?.description}
              </p>
            </div>

            {/* Proof of Completion */}
            {milestoneContent?.proofUrls && milestoneContent.proofUrls.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Proof of Completion
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {milestoneContent.proofUrls.map((url, index) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative aspect-video bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                    >
                      <img
                        src={url}
                        alt={`Proof ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden absolute inset-0 flex items-center justify-center">
                        <FileText className="w-12 h-12 text-gray-400" />
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                        <ExternalLink className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Voter List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Voters ({milestone.votes.length})
                </h2>
              </div>

              {milestone.votes.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">No votes yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedVoters.map((vote: any) => (
                    <div
                      key={vote.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {vote.support ? (
                          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                            <ThumbsUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                            <ThumbsDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-mono text-sm text-gray-900 dark:text-white">
                            {vote.voter.slice(0, 6)}...{vote.voter.slice(-4)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDistanceToNow(new Date(parseInt(vote.timestamp) * 1000))} ago
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {parseFloat(formatEther(vote.weight)).toFixed(4)} BNB
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Vote weight
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Vote Tallies */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Vote Results
              </h3>

              {/* Approval Threshold */}
              <div className="mb-6 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Approval Threshold
                  </span>
                  <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                    {approvalThreshold.toFixed(2)}%
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Requires 2/3 majority to approve
                </p>
              </div>

              {/* Support */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ThumbsUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="font-medium text-gray-900 dark:text-white">Support</span>
                  </div>
                  <span className="font-bold text-green-600 dark:text-green-400">
                    {forPercentage.toFixed(2)}%
                  </span>
                </div>
                <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-600 dark:bg-green-400 transition-all"
                    style={{ width: `${forPercentage}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {parseFloat(formatEther(milestone.votesFor)).toFixed(4)} BNB
                </p>
              </div>

              {/* Against */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ThumbsDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <span className="font-medium text-gray-900 dark:text-white">Against</span>
                  </div>
                  <span className="font-bold text-red-600 dark:text-red-400">
                    {againstPercentage.toFixed(2)}%
                  </span>
                </div>
                <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-600 dark:bg-red-400 transition-all"
                    style={{ width: `${againstPercentage}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {parseFloat(formatEther(milestone.votesAgainst)).toFixed(4)} BNB
                </p>
              </div>

              {/* Total Votes */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Voting Power</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {parseFloat(formatEther(BigInt(totalVotes.toString()))).toFixed(4)} BNB
                  </span>
                </div>
              </div>
            </div>

            {/* Vote Buttons */}
            {isConnected && isVotingActive && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Cast Your Vote
                </h3>

                {!hasVotingPower ? (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        <p className="font-semibold mb-1">Not eligible to vote</p>
                        <p>You must donate to this campaign to vote on milestones.</p>
                      </div>
                    </div>
                  </div>
                ) : userVote ? (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span className="font-semibold text-gray-900 dark:text-white">
                        You voted: {userVote.support ? 'Support' : 'Against'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Vote weight: {parseFloat(formatEther(userVote.weight)).toFixed(4)} BNB
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Your voting power</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {parseFloat(formatEther(votingPower.toString())).toFixed(4)} BNB
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <button
                        onClick={() => handleVote(true)}
                        disabled={isPending || isConfirming}
                        className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                      >
                        {isPending || isConfirming ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {voteType === true ? 'Voting...' : 'Processing...'}
                          </>
                        ) : (
                          <>
                            <ThumbsUp className="w-5 h-5" />
                            Vote Support
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleVote(false)}
                        disabled={isPending || isConfirming}
                        className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                      >
                        {isPending || isConfirming ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {voteType === false ? 'Voting...' : 'Processing...'}
                          </>
                        ) : (
                          <>
                            <ThumbsDown className="w-5 h-5" />
                            Vote Against
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Campaign Info */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Campaign Info
              </h3>
              <Link
                href={`/projects/${campaignAddress}`}
                className="block hover:bg-gray-50 dark:hover:bg-gray-900 p-3 rounded-lg transition-colors"
              >
                <p className="font-semibold text-gray-900 dark:text-white mb-1">
                  {campaign.title}
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <TrendingUp className="w-4 h-4" />
                  <span>
                    {parseFloat(formatEther(campaign.amountRaised)).toFixed(4)} BNB raised
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
