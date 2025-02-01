'use client';
import { useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';

interface MediaFile {
  file: File;
  preview: string;
  type: 'image' | 'pdf';
}

export const CreateMilestoneForm = ({ onSubmit, onCancel, isPending, isUploading }: { 
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isPending: boolean;
  isUploading: boolean
}) => {
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [media, setMedia] = useState<MediaFile[]>([]);
  

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach(file => {
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onloadend = () => {
          setMedia(prev => [...prev, {
            file,
            preview: reader.result as string,
            type: file.type.startsWith('image/') ? 'image' : 'pdf'
          }]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeMedia = (index: number) => {
    setMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ title, details, media });
  };

  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg mb-4">
        <p className="text-sm text-blue-700">
          Note: Each milestone will have a voting period of two weeks from its creation date.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Milestone Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Milestone Details
        </label>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Media (Images or PDFs)
        </label>
        <input
          type="file"
          onChange={handleFileChange}
          accept="image/*,.pdf"
          multiple
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {media.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {media.map((file, index) => (
            <div key={index} className="relative group">
              {file.type === 'image' ? (
                <div className="relative h-40 rounded-lg overflow-hidden">
                  <Image
                    src={file.preview}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="h-40 bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-sm text-gray-600">PDF: {file.file.name}</p>
                </div>
              )}
              <button
                type="button"
                onClick={() => removeMedia(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          disabled={ isUploading || isPending}
          type="submit"
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          {isUploading ? 'Uploading files...' : isPending ? 'Creating...' : 'Create Milestone'}
        </button>
      </div>
    </form>
  );
}; 