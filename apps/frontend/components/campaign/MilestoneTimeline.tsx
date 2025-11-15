import { Campaign } from '@/types/campaign';
import { MILESTONE_STATUS } from '@/lib/constants';
import { CheckCircle, XCircle, Clock, Circle } from 'lucide-react';
import Link from 'next/link';

interface MilestoneTimelineProps {
  campaign: Campaign;
}

export function MilestoneTimeline({ campaign }: MilestoneTimelineProps) {
  // Sort milestones by creation date (oldest first) - create a copy to avoid mutating read-only array
  const milestones = [...(campaign.milestone || [])].sort((a, b) => {
    const dateA = a.dateCreated ? parseInt(a.dateCreated) : 0;
    const dateB = b.dateCreated ? parseInt(b.dateCreated) : 0;
    return dateA - dateB;
  });

  if (milestones.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Milestones
        </h2>
        <div className="text-center py-8">
          <Circle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            No milestones created yet
          </p>
        </div>
      </div>
    );
  }

  const getStatusInfo = (status: number) => {
    switch (status) {
      case MILESTONE_STATUS.APPROVED:
        return {
          label: 'Approved',
          icon: CheckCircle,
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-900/30',
          borderColor: 'border-green-500',
        };
      case MILESTONE_STATUS.DECLINED:
        return {
          label: 'Declined',
          icon: XCircle,
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-900/30',
          borderColor: 'border-red-500',
        };
      case MILESTONE_STATUS.PENDING:
        return {
          label: 'Pending Vote',
          icon: Clock,
          color: 'text-yellow-600 dark:text-yellow-400',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/30',
          borderColor: 'border-yellow-500',
        };
      default:
        return {
          label: 'Not Started',
          icon: Circle,
          color: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-50 dark:bg-gray-700',
          borderColor: 'border-gray-300 dark:border-gray-600',
        };
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Milestones ({milestones.length}/3)
      </h2>

      <div className="space-y-4">
        {milestones.map((milestone, index) => {
          const statusInfo = getStatusInfo(milestone.status);
          const StatusIcon = statusInfo.icon;
          
          // Calculate votes from votes array
          const votes = milestone.votes || [];
          const supportVotes = votes.filter(v => v.support);
          const totalVoteWeight = votes.reduce((sum, v) => sum + parseFloat(v.weight), 0);
          const supportWeight = supportVotes.reduce((sum, v) => sum + parseFloat(v.weight), 0);
          const votePercentage = totalVoteWeight > 0
            ? ((supportWeight / totalVoteWeight) * 100).toFixed(1)
            : '0';

          return (
            <Link
              key={milestone.id}
              href={`/projects/${campaign.id}/milestone/${milestone.id}`}
              className="block group"
            >
              <div
                className={`border-2 ${statusInfo.borderColor} rounded-lg p-4 hover:shadow-md transition-all`}
              >
                <div className="flex items-start gap-4">
                  {/* Timeline Marker */}
                  <div className="flex-shrink-0">
                    <div
                      className={`w-10 h-10 rounded-full ${statusInfo.bgColor} flex items-center justify-center`}
                    >
                      <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        Milestone {index + 1}
                      </h3>
                      <span
                        className={`text-xs font-medium ${statusInfo.color} ${statusInfo.bgColor} px-2 py-1 rounded-full`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>

                    {/* Vote Progress for Pending */}
                    {milestone.status === MILESTONE_STATUS.PENDING && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">
                            Vote Progress
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {votePercentage}% Support
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all"
                            style={{ width: `${votePercentage}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Needs 66.67% to approve
                        </div>
                      </div>
                    )}

                    {/* Voting Deadline for Pending */}
                    {milestone.status === MILESTONE_STATUS.PENDING &&
                      milestone.periodToVote && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          Voting ends:{' '}
                          {new Date(
                            parseInt(milestone.periodToVote) * 1000
                          ).toLocaleDateString()}
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Add Milestone Button (if owner) */}
      {milestones.length < 3 && campaign.campaignRunning && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Link
            href={`/projects/${campaign.id}/milestone/new`}
            className="w-full flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium px-4 py-3 rounded-lg transition-colors"
          >
            <Circle className="w-5 h-5" />
            Create New Milestone
          </Link>
        </div>
      )}
    </div>
  );
}
