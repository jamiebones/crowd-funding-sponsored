import { Campaign } from '@/types/campaign';
import { formatEther } from 'viem';
import { Users, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface RecentDonationsProps {
  campaign: Campaign;
}

interface NetDonation {
  donorId: string;
  netAmount: bigint;
  lastTimestamp: string;
  totalDonated: bigint;
  totalWithdrawn: bigint;
}

export function RecentDonations({ campaign }: RecentDonationsProps) {
  const allDonations = campaign.donations || [];
  const withdrawals = campaign.donorsRecall || [];
  
  // Calculate net donations per donor
  const donorMap = new Map<string, NetDonation>();
  
  // Add all donations
  allDonations.forEach((donation) => {
    const donorId = donation.donor.id;
    const existing = donorMap.get(donorId);
    
    if (existing) {
      existing.totalDonated += BigInt(donation.amount);
      existing.netAmount += BigInt(donation.amount);
      // Keep the most recent timestamp
      if (parseInt(donation.timestamp) > parseInt(existing.lastTimestamp)) {
        existing.lastTimestamp = donation.timestamp;
      }
    } else {
      donorMap.set(donorId, {
        donorId,
        netAmount: BigInt(donation.amount),
        lastTimestamp: donation.timestamp,
        totalDonated: BigInt(donation.amount),
        totalWithdrawn: BigInt(0),
      });
    }
  });
  
  // Subtract withdrawals
  withdrawals.forEach((withdrawal) => {
    const donorId = typeof withdrawal.donor === 'string' ? withdrawal.donor : withdrawal.donor.id;
    const existing = donorMap.get(donorId);
    
    if (existing) {
      existing.totalWithdrawn += BigInt(withdrawal.amount);
      existing.netAmount -= BigInt(withdrawal.amount);
    }
  });
  
  // Filter out donors with zero or negative net donations
  const activeDonors = Array.from(donorMap.values())
    .filter((donor) => donor.netAmount > BigInt(0))
    .sort((a, b) => parseInt(b.lastTimestamp) - parseInt(a.lastTimestamp)); // Sort by most recent
  
  const recentDonors = activeDonors.slice(0, 10); // Show 10 most recent

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (activeDonors.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Recent Donations
        </h2>
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            No active donations. Be the first to support this campaign!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Recent Donors ({activeDonors.length})
        </h2>
        {activeDonors.length > 10 && (
          <Link
            href={`/projects/${campaign.id}/donations`}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            View All
          </Link>
        )}
      </div>

      <div className="space-y-3">
        {recentDonors.map((donor, index) => {
          const amount = formatEther(donor.netAmount);
          const timestamp = new Date(parseInt(donor.lastTimestamp) * 1000);
          const isRecent =
            Date.now() - timestamp.getTime() < 24 * 60 * 60 * 1000; // Last 24 hours
          const hasWithdrawn = donor.totalWithdrawn > BigInt(0);

          return (
            <div
              key={donor.donorId}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                isRecent
                  ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              } hover:shadow-sm transition-shadow`}
            >
              <div className="flex items-center gap-3 flex-1">
                {/* Donor Avatar/Number */}
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    #{index + 1}
                  </div>
                </div>

                {/* Donor Info */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/user/${donor.donorId}`}
                    className="font-mono text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1"
                  >
                    {truncateAddress(donor.donorId)}
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {timestamp.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {isRecent && (
                      <span className="ml-2 text-blue-600 dark:text-blue-400 font-semibold">
                        • New
                      </span>
                    )}
                  </p>
                  {hasWithdrawn && (
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-0.5">
                      Net: {formatEther(donor.totalDonated)} - {formatEther(donor.totalWithdrawn)} BNB
                    </p>
                  )}
                </div>

                {/* Amount */}
                <div className="text-right">
                  <p className="font-bold text-gray-900 dark:text-white">
                    {parseFloat(amount).toFixed(4)} BNB
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    ~${(parseFloat(amount) * 300).toFixed(2)} USD
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      {activeDonors.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {campaign.backers}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Backers
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatEther(BigInt(campaign.amountRaised))} BNB
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Raised
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
