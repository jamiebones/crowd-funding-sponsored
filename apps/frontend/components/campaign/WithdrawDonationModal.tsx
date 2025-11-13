'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther } from 'viem';
import { X, AlertTriangle, CheckCircle2, Loader2, ArrowDownLeft, Info } from 'lucide-react';
import CROWDFUNDING_ABI from '@/abis/CrowdFunding.json';

interface WithdrawDonationModalProps {
  campaignAddress: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function WithdrawDonationModal({ campaignAddress, onClose, onSuccess }: WithdrawDonationModalProps) {
  const { address } = useAccount();
  const [withdrawalDetails, setWithdrawalDetails] = useState<{
    donationAmount: bigint;
    withdrawableAmount: bigint;
    taxAmount: bigint;
    approvedMilestones: number;
    percentageReturn: number;
  } | null>(null);

  // Read user's donation amount
  const { data: donationAmount, isLoading: isDonationLoading } = useReadContract({
    address: campaignAddress as `0x${string}`,
    abi: CROWDFUNDING_ABI.abi,
    functionName: 'donors',
    args: [address],
  });

  // Read campaign stats to get approved milestones
  const { data: campaignStats, isLoading: isStatsLoading } = useReadContract({
    address: campaignAddress as `0x${string}`,
    abi: CROWDFUNDING_ABI.abi,
    functionName: 'getCampaignStats',
  });

  // Extract approved milestones from campaign stats (index 3 of the return tuple)
  const approvedMilestones = campaignStats ? (campaignStats as any)[3] : undefined;

  // Withdraw donation
  const {
    writeContract: withdrawDonation,
    data: withdrawHash,
    isPending: isWithdrawPending,
    error: withdrawError,
  } = useWriteContract();

  const { isLoading: isWithdrawConfirming, isSuccess: isWithdrawSuccess } =
    useWaitForTransactionReceipt({
      hash: withdrawHash,
    });

  // Calculate withdrawal details
  useEffect(() => {
    // Wait for both queries to complete
    if (isDonationLoading || isStatsLoading) return;
    
    // Check if we have the data (even if it's 0)
    if (donationAmount === undefined || donationAmount === null || approvedMilestones === undefined) return;

    const donation = BigInt(donationAmount.toString());
    const milestones = Number(approvedMilestones);

    // Calculate percentage based on milestones approved
    let percentageReturn = 100;
    if (milestones === 0) {
      percentageReturn = 100;
    } else if (milestones === 1) {
      percentageReturn = 66.67;
    } else if (milestones === 2) {
      percentageReturn = 33.33;
    } else {
      percentageReturn = 0; // Can't withdraw after 3 milestones
    }

    // Calculate withdrawable amount (before tax)
    const withdrawableBase = (donation * BigInt(Math.floor(percentageReturn * 100))) / BigInt(10000);
    
    // Calculate 10% tax
    const tax = (withdrawableBase * BigInt(10)) / BigInt(100);
    const withdrawable = withdrawableBase - tax;

    setWithdrawalDetails({
      donationAmount: donation,
      withdrawableAmount: withdrawable,
      taxAmount: tax,
      approvedMilestones: milestones,
      percentageReturn,
    });
  }, [donationAmount, approvedMilestones, isDonationLoading, isStatsLoading]);

  const handleWithdraw = async () => {
    if (!withdrawalDetails || withdrawalDetails.withdrawableAmount === BigInt(0)) return;

    try {
      withdrawDonation({
        address: campaignAddress as `0x${string}`,
        abi: CROWDFUNDING_ABI.abi,
        functionName: 'retrieveDonatedAmount',
      });
    } catch (error) {
      console.error('Withdrawal error:', error);
    }
  };

  // Handle success
  useEffect(() => {
    if (isWithdrawSuccess) {
      // Show success message for a bit, then trigger callback
      const timeoutId = setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000); // Increased to give subgraph more time to index

      // Cleanup timeout on unmount
      return () => clearTimeout(timeoutId);
    }
  }, [isWithdrawSuccess, onSuccess, onClose]);

  // Check if withdrawal is allowed
  const canWithdraw = withdrawalDetails && 
    withdrawalDetails.donationAmount > BigInt(0) && 
    withdrawalDetails.approvedMilestones < 3;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <ArrowDownLeft className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Withdraw Donation
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {isDonationLoading || isStatsLoading || !withdrawalDetails ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : !canWithdraw ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {withdrawalDetails.donationAmount === BigInt(0)
                  ? "No Donation Found"
                  : "Withdrawal Not Allowed"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {withdrawalDetails.donationAmount === BigInt(0)
                  ? "You have not donated to this campaign."
                  : "Cannot withdraw after 3 milestones have been approved."}
              </p>
            </div>
          ) : (
            <>
              {/* Warning Banner */}
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-orange-800 dark:text-orange-200">
                    <p className="font-medium mb-1">Important Information</p>
                    <ul className="list-disc list-inside space-y-1 text-orange-700 dark:text-orange-300">
                      <li>A 10% withdrawal tax will be applied</li>
                      <li>Your MWG-DT tokens will be burned</li>
                      <li>You'll lose voting rights on this campaign</li>
                      {withdrawalDetails.approvedMilestones > 0 && (
                        <li>
                          Only {withdrawalDetails.percentageReturn.toFixed(2)}% of your donation is withdrawable
                          ({withdrawalDetails.approvedMilestones} milestone{withdrawalDetails.approvedMilestones > 1 ? 's' : ''} approved)
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Withdrawal Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Your Donation</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatEther(withdrawalDetails.donationAmount)} BNB
                  </span>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Withdrawable Amount</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatEther(withdrawalDetails.withdrawableAmount + withdrawalDetails.taxAmount)} BNB
                    <span className="text-sm text-gray-500 ml-1">
                      ({withdrawalDetails.percentageReturn.toFixed(2)}%)
                    </span>
                  </span>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Withdrawal Tax (10%)</span>
                  <span className="font-semibold text-orange-600 dark:text-orange-400">
                    -{formatEther(withdrawalDetails.taxAmount)} BNB
                  </span>
                </div>

                <div className="flex justify-between items-center py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-4">
                  <span className="font-semibold text-gray-900 dark:text-white">You'll Receive</span>
                  <span className="text-xl font-bold text-green-600 dark:text-green-400">
                    {formatEther(withdrawalDetails.withdrawableAmount)} BNB
                  </span>
                </div>
              </div>

              {/* Transaction Status */}
              {withdrawError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                    <div className="text-sm text-red-800 dark:text-red-200">
                      <p className="font-medium">Transaction Failed</p>
                      <p className="mt-1 text-red-700 dark:text-red-300">
                        {withdrawError.message?.includes('user rejected') 
                          ? 'Transaction rejected by user'
                          : 'Failed to withdraw. Please try again.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isWithdrawSuccess && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <div className="text-sm text-green-800 dark:text-green-200">
                      <p className="font-medium">Withdrawal Successful!</p>
                      <p className="mt-1 text-green-700 dark:text-green-300">
                        Your funds have been returned to your wallet.
                      </p>
                      <p className="mt-1 text-green-700 dark:text-green-300 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Updating campaign data in a few seconds...
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {canWithdraw && (
          <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              disabled={isWithdrawPending || isWithdrawConfirming}
              className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleWithdraw}
              disabled={isWithdrawPending || isWithdrawConfirming || isWithdrawSuccess}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isWithdrawPending || isWithdrawConfirming ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isWithdrawPending ? 'Confirm in Wallet...' : 'Processing...'}
                </>
              ) : isWithdrawSuccess ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Withdrawn
                </>
              ) : (
                <>
                  <ArrowDownLeft className="w-5 h-5" />
                  Withdraw Funds
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
