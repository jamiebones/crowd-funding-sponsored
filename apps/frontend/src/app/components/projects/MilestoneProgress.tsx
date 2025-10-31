import Milestone from "@/app/interface/Milestone";

interface MilestoneProgressProps {
  milestones: Milestone[];
}

export function MilestoneProgress({ milestones }: MilestoneProgressProps) {
  // Add safety check for milestones array
  if (!milestones || milestones.length === 0) {
    return (
      <div className="w-full space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Project Milestones</h2>
          <span className="text-sm text-muted-foreground">No milestones available</span>
        </div>
        <div className="text-center py-8 text-gray-500">
          No milestones have been set for this project yet.
        </div>
      </div>
    );
  }

  const completedMilestones = milestones.filter((m) => +m.status === 2).length;
  const totalMilestones = milestones.length;
  const progressPercentage = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1: return "bg-yellow-500 text-yellow-50"; // Pending
      case 2: return "bg-green-500 text-green-50"; // Approved
      case 3: return "bg-red-500 text-red-50"; // Declined
      default: return "bg-gray-200 dark:bg-gray-700";
    }
  };

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 1: return "Pending";
      case 2: return "Approved";
      case 3: return "Declined";
      default: return "Unknown";
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Project Milestones</h2>
        <span className="text-sm text-muted-foreground">
          {completedMilestones} of {totalMilestones} completed
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className="absolute h-2 rounded-full bg-primary transition-all duration-300 ease-in-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Milestone timeline */}
      <div className="flex justify-between relative">
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700" />
        {milestones.map((milestone, index) => (
          <div
            key={milestone.id}
            className="flex flex-col items-center space-y-2 relative z-10"
          >
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center ${getStatusColor(
                milestone.status
              )}`}
            >
              {milestone.status === 2 ? (
                <CheckIcon className="h-5 w-5" />
              ) : (
                <span className="text-sm">{index + 1}</span>
              )}
            </div>
            <span className="text-sm font-medium">
              {milestone.content?.title || `Milestone ${index + 1}`}
            </span>
            <span className={`text-xs ${+milestone.status === 2 ? 'text-primary' : 'text-muted-foreground'}`}>
              {getStatusLabel(milestone.status)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
