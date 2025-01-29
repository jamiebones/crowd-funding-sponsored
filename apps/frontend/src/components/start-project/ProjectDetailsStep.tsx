interface Props {
  projectData: {
    title: string;
    description: string;
    duration: number;
  };
  onUpdate: (data: Partial<{
    title: string;
    description: string;
    duration: number;
  }>) => void;
}

export default function ProjectDetailsStep({ projectData, onUpdate }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <label className="text-sm font-medium text-gray-700 mb-1">
          Project Title
        </label>
        <input
          type="text"
          value={projectData.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          className="form-input block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
        />
      </div>
      
      <div className="flex flex-col">
        <label className="text-sm font-medium text-gray-700 mb-1">
          Project Description
        </label>
        <textarea
          rows={4}
          value={projectData.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          className="form-textarea block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
        />
      </div>
      
      <div className="flex flex-col">
        <label className="text-sm font-medium text-gray-700 mb-1">
          Project Duration (days)
        </label>
        <input
          type="number"
          min="1"
          max="60"
          value={projectData.duration}
          onChange={(e) => onUpdate({ duration: Number(e.target.value) })}
          className="form-input block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
        />
      </div>
    </div>
  );
} 