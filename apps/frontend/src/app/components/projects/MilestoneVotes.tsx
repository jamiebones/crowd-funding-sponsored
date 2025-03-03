"use client"
import { FaThumbsUp, FaThumbsDown } from 'react-icons/fa';
import { useEffect } from 'react';
import { useWriteContract, useAccount } from "wagmi";
import { toast } from 'react-toastify';
import CrowdFundingFactoryABI from "../../../../abis/CrowdFundingContract.json";


const MilestoneVotes = ({contractAddress}: {contractAddress: string}) => {
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
      toast.error(`Error sending transaction: ${errorVoting?.message}`, {
        position: "top-right",
      });
    }
  }, [isError, errorVoting]);

  useEffect(() => {
    if (isSuccess) {
      toast.success(`Voting successful: Transaction hash: ${hash}`, {
        position: "top-right",
      });
      window.location.reload();
    }
  }, [isSuccess, hash]);



  const handleVote = (type: 'up' | 'down') => {
    let vote = false;
    if (type === 'up') {
      vote = true;
    } 

    const voteMessage = vote === true ? "in support" : "against";

    const confirmVote = confirm(`Are you sure you want to vote ${voteMessage} of the milestone?`);

    if (!confirmVote) {
      return;
    }

    if (!address) {
      toast.error("Please connect your wallet to vote", {
        position: "top-right",
      });
      return;
    }
    writeContract({
      address: contractAddress as `0x${string}`,
      abi: CrowdFundingFactoryABI,
      functionName: 'voteOnMilestone',
      args: [vote],
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
        Cast Your Vote for the Project
      </h2>
      <div className="flex items-center justify-center gap-8">
        <button
          disabled={isPending}
          onClick={() => handleVote('up')}
          className="flex flex-col items-center gap-2 group"
        >
          <FaThumbsUp className="text-4xl text-green-600 group-hover:text-green-700 transition-colors" />
        </button>

        <button
          disabled={isPending}
          onClick={() => handleVote('down')}
          className="flex flex-col items-center gap-2 group"
        >
          <FaThumbsDown className="text-4xl text-red-600 group-hover:text-red-700 transition-colors" />
        </button>
      </div>
    
    </div>
  );
};

export default MilestoneVotes;



