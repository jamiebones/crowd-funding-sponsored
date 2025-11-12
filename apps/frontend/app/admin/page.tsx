'use client';

import { useRouter } from 'next/navigation';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useBalance } from 'wagmi';
import { useQuery } from '@apollo/client/react';
import { GET_PLATFORM_STATS, GET_RECENT_CAMPAIGNS } from '@/lib/queries/admin';
import { formatEther, parseEther } from 'viem';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { 
  Shield,
  TrendingUp,
  Users,
  Rocket,
  DollarSign,
  Activity,
  Settings,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import FACTORY_CONTRACT from '@/abis/CrowdFundingFactory.json';
import { FACTORY_ADDRESS, BLOCK_EXPLORER, CATEGORY_LABELS } from '@/lib/constants';

const FACTORY_ABI = FACTORY_CONTRACT.abi;

export default function AdminPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [newFee, setNewFee] = useState('');
  const [showSetFeeModal, setShowSetFeeModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  // Read factory owner
  const { data: factoryOwner } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: 'owner',
  });

  // Read current funding fee
  const { data: currentFee, refetch: refetchFee } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: 'getFundingFee',
  });

  // Get factory balance
  const { data: factoryBalance, refetch: refetchBalance } = useBalance({
    address: FACTORY_ADDRESS,
  });

  // Set funding fee
  const {
    writeContract: setFundingFee,
    data: setFeeHash,
    isPending: isSetFeePending,
    error: setFeeError,
  } = useWriteContract();

  const { isLoading: isSetFeeConfirming, isSuccess: isSetFeeSuccess } =
    useWaitForTransactionReceipt({
      hash: setFeeHash,
    });

  // Withdraw factory funds
  const {
    writeContract: withdrawFunds,
    data: withdrawHash,
    isPending: isWithdrawPending,
    error: withdrawError,
  } = useWriteContract();

  const { isLoading: isWithdrawConfirming, isSuccess: isWithdrawSuccess } =
    useWaitForTransactionReceipt({
      hash: withdrawHash,
    });

  // GraphQL queries
  const { data: statsData, loading: statsLoading } = useQuery(GET_PLATFORM_STATS);
  const { data: campaignsData, loading: campaignsLoading } = useQuery(GET_RECENT_CAMPAIGNS);

  const campaigns = (campaignsData as any)?.campaigns || [];
  const allCampaigns = (statsData as any)?.campaigns || [];
  const creators = (statsData as any)?.campaignCreators || [];
  const donors = (statsData as any)?.donors || [];
  const milestones = (statsData as any)?.milestones || [];
  const votes = (statsData as any)?.votes || [];

  // Check if user is owner
  const isOwner = address && factoryOwner && address.toLowerCase() === (factoryOwner as string).toLowerCase();

  // Calculate platform statistics
  const stats = useMemo(() => {
    const totalCampaigns = allCampaigns.length;
    const activeCampaigns = allCampaigns.filter((c: any) => c.campaignRunning).length;
    const totalRaised = allCampaigns.reduce((sum: bigint, c: any) => {
      return sum + BigInt(c.amountRaised);
    }, BigInt(0));
    const totalBackers = allCampaigns.reduce((sum: number, c: any) => {
      return sum + c.backers;
    }, 0);

    return {
      totalCampaigns,
      activeCampaigns,
      totalRaised,
      totalBackers,
      totalCreators: creators.length,
      totalDonors: donors.length,
      totalMilestones: milestones.length,
      totalVotes: votes.length,
    };
  }, [allCampaigns, creators, donors, milestones, votes]);

  // Handle set fee success
  useEffect(() => {
    if (isSetFeeSuccess) {
      setShowSetFeeModal(false);
      setNewFee('');
      refetchFee();
    }
  }, [isSetFeeSuccess, refetchFee]);

  // Handle withdraw success
  useEffect(() => {
    if (isWithdrawSuccess) {
      setShowWithdrawModal(false);
      refetchBalance();
    }
  }, [isWithdrawSuccess, refetchBalance]);

  // Redirect if not connected or not owner
  useEffect(() => {
    if (!isConnected) {
      router.push('/');
    } else if (isConnected && factoryOwner && !isOwner) {
      router.push('/');
    }
  }, [isConnected, factoryOwner, isOwner, router]);

  const handleSetFee = () => {
    if (!newFee || parseFloat(newFee) <= 0) return;

    setFundingFee({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: 'setFundingFee',
      args: [parseEther(newFee)],
    });
  };

  const handleWithdraw = () => {
    withdrawFunds({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: 'withdrawFactoryFunds',
    });
  };

  // Show loading state while checking ownership
  if (!isConnected || !factoryOwner) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Show unauthorized if not owner
  if (!isOwner) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-100 dark:bg-red-900 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
            <Shield className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Unauthorized Access
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This page is restricted to platform administrators only.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Platform administration and management
          </p>
        </div>

        {/* Platform Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Campaigns</span>
              <Rocket className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.totalCampaigns}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {stats.activeCampaigns} active
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Raised</span>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {parseFloat(formatEther(stats.totalRaised)).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">BNB</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Platform Fees</span>
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {factoryBalance ? parseFloat(formatEther(factoryBalance.value)).toFixed(4) : '0.0000'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">BNB</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Users</span>
              <Users className="h-5 w-5 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.totalCreators + stats.totalDonors}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {stats.totalCreators} creators, {stats.totalDonors} donors
            </p>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Backers</span>
              <Users className="h-5 w-5 text-gray-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalBackers}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Milestones Created</span>
              <Activity className="h-5 w-5 text-gray-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalMilestones}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Votes Cast</span>
              <Activity className="h-5 w-5 text-gray-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalVotes}
            </p>
          </div>
        </div>

        {/* Platform Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Set Funding Fee */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Platform Fee Settings
              </h2>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Current Fee:</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentFee ? formatEther(currentFee as bigint) : '0'} BNB
              </p>
            </div>

            <button
              onClick={() => setShowSetFeeModal(true)}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Update Fee
            </button>
          </div>

          {/* Withdraw Funds */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <Download className="h-6 w-6 text-green-600" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Withdraw Funds
              </h2>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Available Balance:</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {factoryBalance ? parseFloat(formatEther(factoryBalance.value)).toFixed(4) : '0.0000'} BNB
              </p>
            </div>

            <button
              onClick={() => setShowWithdrawModal(true)}
              disabled={!factoryBalance || factoryBalance.value === BigInt(0)}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Withdraw All
            </button>
          </div>
        </div>

        {/* Recent Campaigns */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Recent Campaigns
          </h2>

          {campaignsLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">No campaigns yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Campaign
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Category
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Progress
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Backers
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Created
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign: any) => {
                    const percentage = campaign.amountSought !== '0' 
                      ? Number((BigInt(campaign.amountRaised) * BigInt(10000)) / BigInt(campaign.amountSought)) / 100
                      : 0;

                    return (
                      <tr key={campaign.id} className="border-b border-gray-100 dark:border-gray-700">
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900 dark:text-white line-clamp-1">
                            {campaign.content?.title || campaign.title || 'Untitled Campaign'}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                            {CATEGORY_LABELS[campaign.category]}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 w-20">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {percentage.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-900 dark:text-white">
                            {campaign.backers}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {campaign.campaignRunning ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded">
                              <CheckCircle2 className="h-3 w-3" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded">
                              <XCircle className="h-3 w-3" />
                              Ended
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDistanceToNow(new Date(Number(campaign.dateCreated) * 1000), {
                              addSuffix: true,
                            })}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Link
                            href={`/projects/${campaign.id}`}
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Set Fee Modal */}
        {showSetFeeModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="set-fee-modal-title"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
              <h3 id="set-fee-modal-title" className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Update Platform Fee
              </h3>

              <div className="mb-4">
                <label htmlFor="new-fee-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Fee (BNB)
                </label>
                <input
                  id="new-fee-input"
                  type="number"
                  step="0.000000001"
                  value={newFee}
                  onChange={(e) => setNewFee(e.target.value)}
                  placeholder="0.000000001"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={isSetFeePending || isSetFeeConfirming}
                  aria-describedby="fee-input-description"
                />
                <p id="fee-input-description" className="sr-only">
                  Enter the new platform fee in BNB. Minimum 0.000000001 BNB.
                </p>
              </div>

              {setFeeError && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 rounded-lg flex items-start gap-2" role="alert">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {setFeeError.message}
                  </p>
                </div>
              )}

              {isSetFeeSuccess && (
                <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 rounded-lg flex items-start gap-2" role="status">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-green-600 dark:text-green-400 mb-1">
                      Fee updated successfully!
                    </p>
                    <a
                      href={`${BLOCK_EXPLORER}/tx/${setFeeHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-green-600 dark:text-green-400 hover:underline"
                      aria-label="View transaction on block explorer"
                    >
                      View transaction
                    </a>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowSetFeeModal(false);
                    setNewFee('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  disabled={isSetFeePending || isSetFeeConfirming}
                  aria-label="Cancel fee update"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSetFee}
                  disabled={!newFee || parseFloat(newFee) <= 0 || isSetFeePending || isSetFeeConfirming}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  aria-label="Confirm fee update"
                >
                  {isSetFeePending || isSetFeeConfirming ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      <span>{isSetFeePending ? 'Confirm in wallet...' : 'Updating...'}</span>
                    </>
                  ) : (
                    'Update Fee'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Withdraw Modal */}
        {showWithdrawModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="withdraw-modal-title"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
              <h3 id="withdraw-modal-title" className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Withdraw Factory Funds
              </h3>

              <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg" role="alert">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                      Confirm Withdrawal
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      You are about to withdraw{' '}
                      <strong>
                        {factoryBalance ? parseFloat(formatEther(factoryBalance.value)).toFixed(4) : '0'} BNB
                      </strong>{' '}
                      from the factory contract.
                    </p>
                  </div>
                </div>
              </div>

              {withdrawError && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {withdrawError.message}
                  </p>
                </div>
              )}

              {isWithdrawSuccess && (
                <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 rounded-lg flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-green-600 dark:text-green-400 mb-1">
                      Withdrawal successful!
                    </p>
                    <a
                      href={`${BLOCK_EXPLORER}/tx/${withdrawHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-green-600 dark:text-green-400 hover:underline"
                    >
                      View transaction
                    </a>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  disabled={isWithdrawPending || isWithdrawConfirming}
                >
                  Cancel
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={isWithdrawPending || isWithdrawConfirming}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isWithdrawPending || isWithdrawConfirming ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {isWithdrawPending ? 'Confirm in wallet...' : 'Processing...'}
                    </>
                  ) : (
                    'Confirm Withdrawal'
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
