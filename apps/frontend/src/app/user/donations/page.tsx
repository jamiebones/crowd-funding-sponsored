'use client';

import { format, formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { getDonorDetails } from '@/lib/queries/getDonorDetails';
import { useAccount, useReadContract } from 'wagmi';
import Donation from '@/app/interface/Donations';
import Withdrawal from '@/app/interface/DonationWithdrawn';
import { getCampaignCategories } from '@/lib/utility';
import TokenABI from '../../../../abis/CrowdFundingToken.json';
const tokenAddress = process.env.NEXT_PUBLIC_TOKEN_ADDRESS;



interface UserDonationsData {
    donor: {
        totalDonated: number;
        totalWithdrawn: number;
        donations: Donation[];
        withdrawals: Withdrawal[];
    }
  
}

export default function DonationsPage() {

    const { address } = useAccount();

    const { data, error, isLoading } = useQuery<UserDonationsData>({
        queryKey: ["donorDetails", address],
        queryFn: ({ queryKey }): any => {
          const [, donorID] = queryKey;
          return getDonorDetails(donorID as string);
        },
        enabled: !!address,
      });

      const { data: balance, error: errorBalance, isLoading: isLoadingBalance } = useReadContract({
        address: tokenAddress as `0x${string}`,
        abi: TokenABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
      });

      console.log("errorBalance", errorBalance)
      console.log("balance", balance)

  const { totalDonated, totalWithdrawn, donations, withdrawals } = data?.donor ?? {};

  // Add empty state components
  if (!address) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="mb-4 text-gray-400">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-6">Please connect your wallet to view your donation history</p>
          <button className="bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600 transition-colors">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="mb-4 text-gray-400 animate-spin">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading...</h2>
          <p className="text-gray-600">Fetching your donation history</p>
        </div>
      </div>
    );
  }

  if (!data?.donor || Object.keys(data.donor).length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="mb-4 text-gray-400">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Donations Yet</h2>
          <p className="text-gray-600 mb-6">Start making a difference by supporting projects you care about</p>
          <a href="/projects" className="bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600 transition-colors inline-block">
            Explore Projects
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 shadow-lg">
          <h3 className="text-white text-lg font-medium">Total Donated</h3>
          <p className="text-white text-3xl font-bold">{totalDonated ? (totalDonated / 10 ** 18) : '0.00'} BNB</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 shadow-lg">
          <h3 className="text-white text-lg font-medium">Total Withdrawn</h3>
          <p className="text-white text-3xl font-bold">{totalWithdrawn ? (totalWithdrawn / 10 ** 18) : '0.00'} BNB</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 shadow-lg">
          <h3 className="text-white text-lg font-medium">Token Balance</h3>
          {isLoadingBalance ? (
            <div className="flex items-center space-x-2 mt-2">
              <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent"></div>
              <span className="text-white">Loading...</span>
            </div>
          ) : (
            <p className="text-white text-3xl font-bold">{balance ? (+balance.toString() / 10 ** 18) : '0.00'} DNTN</p>
          )}
        </div>
      </div>

      {/* Donations Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Donations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {donations?.map((donation) => (
            <motion.div
              key={donation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
              onClick={() => window.open(`/user/projects/${donation.donatingTo.id}`, '_blank')}
            >
              <div className="bg-emerald-50 p-4">
                <h3 className="text-lg font-semibold text-gray-800 truncate">
                  {donation.donatingTo.content.title}
                </h3>
                <p className="text-sm text-gray-500">
                  {format(new Date(+donation.timestamp * 1000), 'PPP')} 
                </p>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-emerald-600 font-bold text-xl">
                    {+donation.amount / 10 ** 18} BNB
                  </span>
                  <span className="text-sm text-gray-500 px-3 py-1 bg-emerald-50 rounded-full">
                    {getCampaignCategories(donation.donatingTo.category)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span className={`${donation.donatingTo.active ? 'text-emerald-600' : 'text-red-600'}`}>
                    {donation.donatingTo.active ? 'Active' : 'Inactive'}
                  </span>
                  <span>
                        Duration: {formatDistanceToNow(+donation.donatingTo.projectDuration * 1000)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Withdrawals Section */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Withdrawals</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {withdrawals?.map((withdrawal) => (
            <motion.div
              key={withdrawal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
              onClick={() => window.open(`/user/projects/${withdrawal.withdrawingFrom.id}`, '_blank')}
            >
              <div className="bg-purple-50 p-4">
                <h3 className="text-lg font-semibold text-gray-800 truncate">
                  {withdrawal.withdrawingFrom.content.title}
                </h3>
                <p className="text-sm text-gray-500">
                  {format(new Date(+withdrawal.timestamp * 1000), 'PPP')}
                </p>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-center">
                  <span className="text-purple-600 font-bold text-xl">
                    {+withdrawal.amount / 10 ** 18} BNB
                  </span>
                  <span className="text-sm text-gray-500 px-3 py-1 bg-purple-50 rounded-full">
                    Withdrawal
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
