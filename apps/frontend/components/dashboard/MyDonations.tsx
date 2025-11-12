import { useQuery } from '@apollo/client/react';
import { GET_USER_DONATIONS, GET_USER_WITHDRAWALS } from '@/lib/queries/dashboard';
import Link from 'next/link';
import { CATEGORIES } from '@/lib/constants';
import { Heart, ArrowDownLeft, ExternalLink, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MyDonationsProps {
  address: string;
}

export function MyDonations({ address }: MyDonationsProps) {
  const { data: donationsData, loading: donationsLoading } = useQuery(GET_USER_DONATIONS, {
    variables: { donor: address.toLowerCase() },
  });

  const { data: withdrawalsData, loading: withdrawalsLoading } = useQuery(GET_USER_WITHDRAWALS, {
    variables: { donor: address.toLowerCase() },
  });

  const loading = donationsLoading || withdrawalsLoading;

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  const donations = (donationsData as any)?.donations || [];
  const withdrawals = (withdrawalsData as any)?.withdrawals || [];

  // Combine and sort by timestamp
  const activities = [
    ...donations.map((d: any) => ({ ...d, type: 'donation' })),
    ...withdrawals.map((w: any) => ({ ...w, type: 'withdrawal' })),
  ].sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));

  if (activities.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No donations yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You haven't made any donations yet. Support campaigns you believe in!
          </p>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Browse Campaigns
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity: any) => {
        const isDonation = activity.type === 'donation';
        const category = CATEGORIES.find((c) => c.id === activity.campaign.category);
        const amount = (parseFloat(activity.amount) / 1e18).toFixed(4);

        return (
          <div
            key={activity.id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className={`
                p-3 rounded-lg
                ${isDonation
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : 'bg-orange-100 dark:bg-orange-900/30'
                }
              `}>
                {isDonation ? (
                  <Heart className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <ArrowDownLeft className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`
                        text-sm font-semibold
                        ${isDonation
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-orange-600 dark:text-orange-400'
                        }
                      `}>
                        {isDonation ? 'Donated' : 'Withdrawn'}
                      </span>
                      <span className="text-xl">{category?.icon}</span>
                    </div>
                    
                    <Link
                      href={`/projects/${activity.campaign.id}`}
                      className="text-gray-900 dark:text-white font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {activity.campaign.content?.title || activity.campaign.title || 'Untitled Campaign'}
                    </Link>

                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {formatDistanceToNow(new Date(parseInt(activity.timestamp) * 1000), { addSuffix: true })}
                        </span>
                      </div>
                      {!activity.campaign.campaignRunning && (
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-medium rounded">
                          Ended
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right">
                    <div className={`
                      text-lg font-bold
                      ${isDonation
                        ? 'text-gray-900 dark:text-white'
                        : 'text-orange-600 dark:text-orange-400'
                      }
                    `}>
                      {isDonation ? '+' : '-'}{amount} BNB
                    </div>
                    {isDonation && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        +{amount} MWG-DT
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Link */}
              <Link
                href={`/projects/${activity.campaign.id}`}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
