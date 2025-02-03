"use client"
import { useEffect } from 'react';
import { useWriteContract, useAccount } from "wagmi";
import { toast } from 'react-toastify';
import CrowdFundingFactoryABI from "../../../../abis/CrowdFundingContract.json";



export const WithdrawMilestoneButton = ({contractAddress}: {contractAddress: string}) => {
const { address } = useAccount();
  const {
    data: hash,
    error: errorVoting,
    writeContract,
    isSuccess,
    isPending,
    isError,
  } = useWriteContract();

  useEffect(() => {
    if (isError) {
      console.log("Error from mutation ", errorVoting);
      toast.error(`Error withdrawing milestone: ${errorVoting?.message}`, {
        position: "top-right",
      });
    }
  }, [isError, errorVoting]);

  useEffect(() => {
    if (isSuccess) {
      toast.success(`Withdrawal successful: Transaction hash: ${hash}`, {
        position: "top-right",
      });
     
    }
  }, [isSuccess, hash]);


  const handleWithdraw = async () => {
    if (!address) {
      toast.error("Please connect your wallet to withdraw", {
        position: "top-right",
      });
      return;
    }
    const confirmWithdraw = confirm("Are you sure you want to withdraw the milestone?");
    if (!confirmWithdraw) {
      return;
    }
    try {
      writeContract({
        address: contractAddress as `0x${string}`,
        abi: CrowdFundingFactoryABI,
        functionName: 'withdrawMilestone',
      });
    } catch (error) {
      console.error('Error withdrawing milestone:', error);
    } 
  };

  return (
    <button
      onClick={handleWithdraw}
      disabled={isPending}
      className={`
        px-4 py-2 mt-6
        text-sm font-medium text-white
        bg-red-500 hover:bg-red-600
        rounded-lg transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {isPending ? 'Withdrawing...' : 'Withdraw Milestone'}
    </button>
  );
}
