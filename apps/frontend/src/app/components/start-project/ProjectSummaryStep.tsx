interface Props {
  projectData: {
    category: string;
    fundingGoal: number;
    projectFee: bigint;
    title: string;
    description: string;
    duration: number;
    images: File[];
  };
  onUpdate: (data: Partial<{
    category: string;
    fundingGoal: number;
    projectFee: number;
    title: string;
    description: string;
    duration: number;
    images: File[];
  }>) => void;
}

export default function ProjectSummaryStep({ projectData, onUpdate }: Props) {
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newImages = Array.from(event.target.files);
      onUpdate({ images: [...projectData.images, ...newImages] });
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = projectData.images.filter((_, i) => i !== index);
    onUpdate({ images: newImages });
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-800">Project Summary</h2>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-500 text-sm mb-1">Category</p>
            <p className="text-gray-800 font-semibold">{projectData.category}</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-500 text-sm mb-1">Funding Goal</p>
            <p className="text-gray-800 font-semibold">${projectData.fundingGoal.toLocaleString()}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-500 text-sm mb-1">Duration</p>
            <p className="text-gray-800 font-semibold">{projectData.duration} days</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-500 text-sm mb-1">Project Fee</p>
            <p className="text-gray-800 font-semibold">
              {projectData.projectFee ? (Number(projectData.projectFee.toString()) / 10 ** 18).toFixed(10) : '0.00'} BNB
            </p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-500 text-sm mb-1">Title</p>
          <p className="text-gray-800 font-semibold">{projectData.title}</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-500 text-sm mb-1">Description</p>
          <p className="text-gray-700 whitespace-pre-wrap">{projectData.description}</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Project Images</h3>
        <div className="mb-4">
          <label className="inline-block px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors cursor-pointer">
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
            />
            Upload Images
          </label>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {projectData.images.map((image, index) => (
            <div key={index} className="relative">
              <img
                src={URL.createObjectURL(image)}
                alt={`Project image ${index + 1}`}
                className="w-full h-40 object-cover rounded-lg"
              />
              <button
                onClick={() => handleRemoveImage(index)}
                className="absolute top-2 right-2 p-1 rounded-full bg-white text-red-500 hover:bg-red-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 