import { DonationCard } from './DonationCard';
import { useDonation } from '../../../context/donationContext';
import { useWriteContract, useAccount } from "wagmi";
import { useEffect } from 'react';
import { toast } from 'react-toastify';
import { ethers } from 'ethers';
import CrowdFundingContractABI from "../../../../abis/CrowdFundingContract.json";
import { useQueryClient } from '@tanstack/react-query';

export const DonorsSection = ({ donors, contractAddress, id }: { donors: any[], contractAddress: string, id: string }) => {
 
  const { setFinishDonating } = useDonation();
  const { address } = useAccount();
  const queryClient = useQueryClient();


  const {
    data: hash,
    error: errorDonating,
    writeContract,
    isSuccess,
    isPending,
    isError,
  } = useWriteContract();

  useEffect(() => {
    if (isError) {
      console.log("Error from mutation ", errorDonating);
      toast.error(`Error sending transaction: ${errorDonating?.message}`, {
        position: "top-right",
      });
      setFinishDonating(true);
    }
  }, [isError, errorDonating]);

  useEffect(() => {
    if (isSuccess) {
      toast.success(`Milestone created successfully: Transaction hash: ${hash}`, {
        position: "top-right",
      });
      setFinishDonating(true);
      queryClient.invalidateQueries({ queryKey: ["projectDetails", id] });
    }
  }, [isSuccess, hash]);




  const handleDonate = async (amount: number) => {
    if (!address) {
      return toast.error('Please connect your wallet first');
    }
    writeContract({
      address: contractAddress as `0x${string}`,
      abi: CrowdFundingContractABI,
      functionName: "giveDonationToCause",
      value: ethers.parseEther(amount.toString()),
    });
  };
 
 

  return (
    <div>
      <DonationCard onDonate={handleDonate} isPending={isPending}/>
      
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold mb-6">Donors</h2>
        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {donors.map((donor) => (
            <div
              key={donor.id}
              className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4"
            >
              <p className="font-medium text-gray-800 mb-2">
                {donor.address.slice(0, 6)}...{donor.address.slice(-4)}
              </p>
              <div className="space-y-2">
                {donor.donations.map((donation: any) => (
                  <div key={donation.id} className="flex justify-between text-sm">
                    <span>{new Date(donation.date).toLocaleDateString()}</span>
                    <span className="font-semibold">{donation.amount} ETH</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 