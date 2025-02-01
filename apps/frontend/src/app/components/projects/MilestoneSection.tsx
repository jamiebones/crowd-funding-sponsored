import { formatDistance } from "date-fns";
import { Carousel } from "./Carousel";

export const MilestoneSection = ({ milestones }: { milestones: any[] }) => (
  <div className="bg-white rounded-2xl shadow-xl p-8">
    <h2 className="text-2xl font-bold mb-6">Milestones</h2>
    <div className="space-y-6">
      {milestones.map((milestone) => (
        <div
          key={milestone.id}
          className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6"
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-semibold">{milestone.content.title}</h3>
            <span className={`px-4 py-1 rounded-full ${
              milestone.status === 'COMPLETED'
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {milestone.status}
            </span>
          </div>
          <p className="text-gray-600 mb-4">{milestone.content.details}</p>
          <div className="flex gap-4 text-sm text-gray-500">
            <span>Created: {formatDistance(new Date(milestone.dateCreated * 1000), new Date(), { addSuffix: true })}</span>
            <span>Voting Period: {formatDistance(new Date(milestone.periodToVote * 1000), new Date(), { addSuffix: true })}</span>
          </div>
          <div className="mt-6">
            <Carousel media={milestone.content.media} />
          </div>
        </div>

        
      ))}
    </div>
  </div>
); 