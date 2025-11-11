import { Campaign } from '@/types/campaign';
import { formatEther } from 'viem';
import { Users, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface RecentDonationsProps {
  campaign: Campaign;
}

export function RecentDonations({ campaign }: RecentDonationsProps) {
  const donations = campaign.donations || [];
  const recentDonations = donations.slice(0, 10); // Show 10 most recent

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (donations.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Recent Donations
        </h2>
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            No donations yet. Be the first to support this campaign!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Recent Donations ({donations.length})
        </h2>
        {donations.length > 10 && (
          <Link
            href={`/projects/${campaign.id}/donations`}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            View All
          </Link>
        )}
      </div>

      <div className="space-y-3">
        {recentDonations.map((donation, index) => {
          const amount = formatEther(BigInt(donation.amount));
          const timestamp = new Date(parseInt(donation.timestamp) * 1000);
          const isRecent =
            Date.now() - timestamp.getTime() < 24 * 60 * 60 * 1000; // Last 24 hours

          return (
            <div
              key={donation.id}
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
                    #{donations.length - index}
                  </div>
                </div>

                {/* Donor Info */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/user/${donation.donor.id}`}
                    className="font-mono text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1"
                  >
                    {truncateAddress(donation.donor.id)}
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
      {donations.length > 0 && (
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
