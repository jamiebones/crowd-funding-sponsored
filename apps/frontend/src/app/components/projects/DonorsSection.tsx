import { DonationCard } from './DonationCard';
import { useDonation } from '../../../context/donationContext';
import { useWriteContract, useAccount } from "wagmi";
import { useEffect} from 'react';
import { toast } from 'react-toastify';
import { ethers } from 'ethers';
import CrowdFundingContractABI from "../../../../abis/CrowdFundingContract.json";
import { useQueryClient } from '@tanstack/react-query';
import { FaCopy } from 'react-icons/fa';
import { copyToClipboard, filterDonations } from '@/lib/utility';
import { truncateAddress } from '@/lib/utility';

export const DonorsSection = ({ donations, contractAddress, id, withdrawals }: 
  { donations: any[], contractAddress: string, id: string, withdrawals: any[] }) => {
 
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

  const handleWithdraw = async () => {
    if (!address) {
      return toast.error('Please connect your wallet first');
    }
    writeContract({
      address: contractAddress as `0x${string}`,
      abi: CrowdFundingContractABI,
      functionName: "retrieveDonatedAmount",
      args: []
    });
  };

  

  const filteredDonations = filterDonations(donations, withdrawals);

  return (
    <div>
      <DonationCard onDonate={handleDonate} isPending={isPending}/>
      
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold mb-6">Donors</h2>
        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {filteredDonations.map((donation) => (
            <div
              key={donation.id}
              className="bg-gradient-to-r from-purple-100 to-blue-50 rounded-xl p-4 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">
                      {truncateAddress(donation.donor.id)}
                    </span>
                    <button
                      onClick={() => copyToClipboard(donation.donor.id)}
                      className="text-gray-500 hover:text-purple-600 transition-colors"
                    >
                      <FaCopy size={14} />
                    </button>
                  </div>
               
                  <span className="font-semibold text-purple-600">
                    {(+donation.amount.toString()) / 10 ** 18} BNB
                  </span>

                  <span className="text-sm text-gray-600">
                    {new Date(donation.timestamp * 1000).toLocaleDateString()}
                  </span>
                </div>
                {address && address.toLowerCase() === donation.donor.id.toLowerCase() && (
                  <button
                    onClick={() => handleWithdraw()}
                    disabled={isPending}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {isPending ? 'Withdrawing...' : 'Withdraw'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 