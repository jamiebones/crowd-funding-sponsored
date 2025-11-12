import { useQuery } from '@apollo/client/react';
import { GET_USER_VOTES } from '@/lib/queries/dashboard';
import Link from 'next/link';
import { CATEGORIES, MILESTONE_STATUS } from '@/lib/constants';
import { Vote, ThumbsUp, ThumbsDown, ExternalLink, Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MyVotesProps {
  address: string;
}

export function MyVotes({ address }: MyVotesProps) {
  const { data, loading, error } = useQuery(GET_USER_VOTES, {
    variables: { voter: address.toLowerCase() },
  });

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

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-600 dark:text-red-400">
          Error loading votes: {error.message}
        </p>
      </div>
    );
  }

  const votes = (data as any)?.votes || [];

  if (votes.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Vote className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No votes yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You haven't voted on any milestones yet. Vote on milestones from campaigns you've supported!
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
      {votes.map((vote: any) => {
        const category = CATEGORIES.find((c) => c.id === vote.milestone.campaign.category);
        const weight = (parseFloat(vote.weight) / 1e18).toFixed(4);
        const votingEnded = new Date(parseInt(vote.milestone.periodToVote) * 1000) < new Date();

        const statusInfo = {
          [MILESTONE_STATUS.DEFAULT]: { label: 'Not Submitted', color: 'gray', icon: Clock },
          [MILESTONE_STATUS.PENDING]: { label: 'Voting', color: 'blue', icon: Vote },
          [MILESTONE_STATUS.APPROVED]: { label: 'Approved', color: 'green', icon: CheckCircle2 },
          [MILESTONE_STATUS.DECLINED]: { label: 'Declined', color: 'red', icon: XCircle },
        };

        const status = statusInfo[vote.milestone.status as keyof typeof statusInfo];
        const StatusIcon = status?.icon || Clock;

        return (
          <div
            key={vote.id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              {/* Vote Icon */}
              <div className={`
                p-3 rounded-lg
                ${vote.support
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : 'bg-red-100 dark:bg-red-900/30'
                }
              `}>
                {vote.support ? (
                  <ThumbsUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <ThumbsDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`
                        text-sm font-semibold
                        ${vote.support
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                        }
                      `}>
                        Voted {vote.support ? 'For' : 'Against'}
                      </span>
                      <span className="text-xl">{category?.icon}</span>
                      <span className={`
                        px-2 py-0.5 text-xs font-medium rounded flex items-center gap-1
                        ${status?.color === 'green' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                          status?.color === 'red' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                          status?.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                          'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}
                      `}>
                        <StatusIcon className="w-3 h-3" />
                        {status?.label}
                      </span>
                    </div>
                    
                    <Link
                      href={`/projects/${vote.milestone.campaign.id}`}
                      className="text-gray-900 dark:text-white font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {vote.milestone.campaign.title}
                    </Link>

                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {formatDistanceToNow(new Date(parseInt(vote.timestamp) * 1000), { addSuffix: true })}
                        </span>
                      </div>
                      {votingEnded && (
                        <span className="text-xs">
                          Voting ended
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Vote Weight */}
                  <div className="text-right">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Vote weight
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {weight} BNB
                    </div>
                  </div>
                </div>
              </div>

              {/* Link */}
              <Link
                href={`/projects/${vote.milestone.campaign.id}/milestone/${vote.milestone.id}`}
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
