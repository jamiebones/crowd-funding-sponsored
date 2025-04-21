import { formatDistance } from "date-fns";
import { Carousel } from "./Carousel";
import { getMilestoneStatus } from "@/app/constant/milestoneStatus";
import MilestoneVotes from "./MilestoneVotes";
import { filterDonations, canWithdrawMilestone } from '@/lib/utility';
import { useAccount } from "wagmi";
import VoteDisplay from "./VoteDisplay";
import { WithdrawMilestoneButton } from "./WithdrawMilestoneButton";



export const MilestoneSection = ({ owner, milestones, currentMilestone, donations, withdrawals, contractAddress, projectDuration }: 
  { owner: string, milestones: any[], currentMilestone: string, donations: any[], withdrawals: any[], contractAddress: string, projectDuration: number}) => {
  const { address } = useAccount();
  // Sort milestones so current milestone is first
  const sortedMilestones = [...milestones].sort((a, b) => {
    if (a.id === currentMilestone) return -1;
    if (b.id === currentMilestone) return 1;
    return 0;
  });

  console.log("currentMilestone", milestones);

  

  const filteredDonations = filterDonations(donations, withdrawals);
  const isDonor = filteredDonations.some(donation => donation.donor.id.toLowerCase() === address?.toLowerCase());
  const hasVoted = (votes: any[]) => {
    return votes.some(vote => 
      vote.voter.toLowerCase() === address?.toLowerCase());
  }


  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <h2 className="text-2xl font-bold mb-6">Milestones</h2>
      <div className="space-y-4">
        {sortedMilestones.map((milestone) => (
          <details
            key={milestone.id}
            className="group"
            open={milestone.id === currentMilestone}
          >
            <summary className="flex justify-between items-center cursor-pointer bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 hover:from-purple-100 hover:to-blue-100">
              <div className="flex items-center gap-4">
                <svg 
                  className="w-5 h-5 transform transition-transform group-open:rotate-180" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <h3 className="text-xl font-semibold">{milestone.content.title}</h3>
              </div>
              <span className={`px-4 py-1 rounded-full ${
                milestone.status === 2
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {getMilestoneStatus(+milestone.status)}
              </span>
            </summary>
            
            <div className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-b-xl border-t">
              <p className="text-gray-600 mb-4">{milestone.content.details}</p>
              <div className="flex flex-col gap-4 text-sm">
                <div className="flex items-center gap-2 bg-white/50 p-3 rounded-lg shadow-sm">
                  <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-600">
                    Created <span className="font-medium text-purple-700">{formatDistance(new Date(milestone.dateCreated * 1000), new Date(), { addSuffix: true })}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-white/50 p-3 rounded-lg shadow-sm">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-600">
                    {new Date(milestone.periodToVote * 1000) > new Date() 
                      ? "Voting ends "
                      : "Voting ended "} 
                    <span className="font-medium text-blue-700">
                      {formatDistance(new Date(milestone.periodToVote * 1000), new Date(), { addSuffix: true })}
                    </span>
                  </span>
                </div>
              </div>
              <div className="mt-6">
                <Carousel media={milestone.content.media} />
              </div>
            </div>


              <div className="mt-6 flex-col justify-between items-center">
                  {isDonor && !hasVoted(milestone.votes) 
                    && currentMilestone === milestone.milestoneCID 
                    && +milestone.status === 1 && milestones.length > 1
                    && <MilestoneVotes contractAddress={contractAddress} />
                  }

                  { milestone.votes.length > 0 ? (
                    <VoteDisplay votes={milestone.votes} />
                  ) : milestone.id === milestones[0].id && (
                    <div className="text-center py-6 bg-gray-50 rounded-lg">
                      <svg 
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                        />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No votes yet</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Be the first to vote on this milestone.
                      </p>
                    </div>
                  )}
              </div>


              { canWithdrawMilestone(projectDuration, milestone.dateCreated) && address?.toLowerCase() !== "" &&
              +milestone.status === 1 &&
              <div className="flex justify-center mt-6">
                <WithdrawMilestoneButton 
                  contractAddress={contractAddress} 
                />
              </div>}

          </details>
        ))}
      </div>
    </div>
  );
}; 