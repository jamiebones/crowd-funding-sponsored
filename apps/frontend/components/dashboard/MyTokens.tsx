import { useQuery } from '@apollo/client/react';
import { GET_USER_DONOR_PROFILE, GET_USER_DONATIONS } from '@/lib/queries/dashboard';
import Link from 'next/link';
import { CATEGORIES } from '@/lib/constants';
import { Coins, TrendingUp, Award, ExternalLink, Calendar, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MyTokensProps {
  address: string;
}

export function MyTokens({ address }: MyTokensProps) {
  const { data: donorData, loading: donorLoading } = useQuery(GET_USER_DONOR_PROFILE, {
    variables: { id: address.toLowerCase() },
  });

  const { data: donationsData, loading: donationsLoading } = useQuery(GET_USER_DONATIONS, {
    variables: { donor: address.toLowerCase() },
  });

  if (donorLoading || donationsLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 animate-pulse">
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        </div>
      </div>
    );
  }

  const donor = (donorData as any)?.donor;
  const donations = (donationsData as any)?.donations || [];

  // Calculate token balance
  const totalDonated = donor ? parseFloat(donor.totalDonated) : 0;
  const totalWithdrawn = donor ? parseFloat(donor.totalWithdrawn) : 0;
  const tokenBalance = (totalDonated - totalWithdrawn) / 1e18;

  return (
    <div className="space-y-6">
      {/* Token Balance Card */}
      <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 text-white rounded-xl p-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Coins className="w-6 h-6" />
              <span className="text-sm font-medium opacity-90">Your Balance</span>
            </div>
            <div className="text-5xl font-bold mb-1">
              {tokenBalance.toFixed(2)}
            </div>
            <div className="text-lg opacity-90">MWG-DT Tokens</div>
          </div>
          <div className="p-3 bg-white/20 rounded-lg">
            <Award className="w-8 h-8" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/20">
          <div>
            <div className="text-sm opacity-75 mb-1">Total Earned</div>
            <div className="text-2xl font-semibold">
              {(totalDonated / 1e18).toFixed(4)}
            </div>
          </div>
          <div>
            <div className="text-sm opacity-75 mb-1">Total Burned</div>
            <div className="text-2xl font-semibold">
              {(totalWithdrawn / 1e18).toFixed(4)}
            </div>
          </div>
        </div>
      </div>

      {/* Token Utility Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              How MWG-DT Tokens Work
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                <span>Earn 1 MWG-DT token for every 1 BNB donated to campaigns</span>
              </li>
              <li className="flex items-start gap-2">
                <Award className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                <span>Use your tokens to vote on milestone completion with vote weight = donation amount</span>
              </li>
              <li className="flex items-start gap-2">
                <Coins className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                <span>Tokens are burned when you withdraw your donations (with 10% penalty)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Token Earning History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Token Earning History
          </h3>
        </div>

        {donations.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Coins className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No tokens earned yet
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start earning MWG-DT tokens by supporting campaigns!
            </p>
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Browse Campaigns
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {donations.map((donation: any) => {
              const category = CATEGORIES.find((c) => c.id === donation.campaign.category);
              const amount = (parseFloat(donation.amount) / 1e18).toFixed(4);
              
              return (
                <div
                  key={donation.id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Token Icon */}
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Coins className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                              Earned {amount} MWG-DT
                            </span>
                            <span className="text-xl">{category?.icon}</span>
                            {!donation.campaign.campaignRunning && (
                              <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                Ended
                              </span>
                            )}
                          </div>
                          
                          <Link
                            href={`/projects/${donation.campaign.id}`}
                            className="text-gray-900 dark:text-white font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            {donation.campaign.title}
                          </Link>

                          <div className="flex items-center gap-1 mt-2 text-sm text-gray-600 dark:text-gray-400">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {formatDistanceToNow(new Date(parseInt(donation.timestamp) * 1000), { addSuffix: true })}
                            </span>
                          </div>
                        </div>

                        {/* Donation Amount */}
                        <div className="text-right">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Donated
                          </div>
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {amount} BNB
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Link */}
                    <Link
                      href={`/projects/${donation.campaign.id}`}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CTA for more tokens */}
      {donations.length > 0 && (
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6 text-center">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
            Want to earn more tokens?
          </h4>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Support more campaigns and increase your voting power!
          </p>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all"
          >
            Explore Campaigns
          </Link>
        </div>
      )}
    </div>
  );
}
