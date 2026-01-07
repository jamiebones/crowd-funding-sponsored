import { CampaignFormData } from '@/app/new-project/page';
import { useState, useCallback, useRef } from 'react';
import { Upload, X, AlertCircle, Loader2, FileImage, FileVideo } from 'lucide-react';

interface StepTwoProps {
  formData: CampaignFormData;
  updateFormData: (data: Partial<CampaignFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const MAX_TOTAL_SIZE = process.env.NEXT_PUBLIC_MAX_UPLOAD_SIZE 
  ? parseInt(process.env.NEXT_PUBLIC_MAX_UPLOAD_SIZE) 
  : 10 * 1024 * 1024; // Default: 10MB in bytes

const MAX_FILES_COUNT = process.env.NEXT_PUBLIC_MAX_FILES_COUNT 
  ? parseInt(process.env.NEXT_PUBLIC_MAX_FILES_COUNT) 
  : 10; // Default: 10 files

export function StepTwo({ formData, updateFormData, onNext, onBack }: StepTwoProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate total size
  const totalSize = formData.files.reduce((acc, file) => acc + file.size, 0);
  const formattedSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Handle file selection
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    const currentFiles = formData.files;
    
    // Reset file input
    const resetFileInput = () => {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    // Check file count
    if (currentFiles.length + newFiles.length > MAX_FILES_COUNT) {
      setErrors({ files: `Maximum ${MAX_FILES_COUNT} files allowed` });
      resetFileInput();
      return;
    }

    // Check total size
    const currentTotalSize = currentFiles.reduce((acc, f) => acc + f.size, 0);
    const newFilesSize = newFiles.reduce((acc, f) => acc + f.size, 0);
    const newTotalSize = currentTotalSize + newFilesSize;
    
    console.log('File size validation:', {
      MAX_TOTAL_SIZE,
      currentTotalSize,
      newFilesSize,
      newTotalSize,
      currentTotalSizeFormatted: formattedSize(currentTotalSize),
      newFilesSizeFormatted: formattedSize(newFilesSize),
      newTotalSizeFormatted: formattedSize(newTotalSize),
      exceedsLimit: newTotalSize > MAX_TOTAL_SIZE
    });
    
    if (newTotalSize > MAX_TOTAL_SIZE) {
      setErrors({ files: `Total size cannot exceed ${formattedSize(MAX_TOTAL_SIZE)} (${formattedSize(newTotalSize)} selected)` });
      resetFileInput();
      return;
    }

    // Check file types (images and videos only)
    const validFiles: File[] = [];
    let hasInvalidFile = false;
    
    newFiles.forEach(file => {
      const isValid = file.type.startsWith('image/') || file.type.startsWith('video/');
      if (isValid) {
        validFiles.push(file);
      } else {
        hasInvalidFile = true;
      }
    });

    if (hasInvalidFile) {
      setErrors({ files: `Only images and videos are allowed` });
      resetFileInput();
      return;
    }

    // Success - add files and clear errors
    updateFormData({ files: [...currentFiles, ...validFiles] });
    setErrors({});
    resetFileInput();
  };

  // Remove file
  const removeFile = (index: number) => {
    const newFiles = formData.files.filter((_, i) => i !== index);
    updateFormData({ files: newFiles });
  };

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  // Upload to Arweave
  const handleUpload = async () => {
    const newErrors: Record<string, string> = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Campaign description is required';
    } else if (formData.description.length < 50) {
      newErrors.description = 'Description must be at least 50 characters';
    }

    if (formData.files.length === 0) {
      newErrors.files = 'At least one image or video is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      // Prepare FormData
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      
      formData.files.forEach((file) => {
        formDataToSend.append('files', file);
      });

      setUploadProgress(30);

      // Upload to API
      const response = await fetch('/api/upload-campaign', {
        method: 'POST',
        body: formDataToSend,
      });

      setUploadProgress(80);

      // Check content type to ensure we got JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
         const text = await response.text();
         throw new Error(`Server returned non-JSON response (${response.status}): ${text.slice(0, 100)}...`);
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setUploadProgress(100);

      // Save Arweave transaction ID
      updateFormData({ arweaveTxId: result.transactionId });

      // Proceed to next step
      setTimeout(() => {
        onNext();
      }, 500);

    } catch (error) {
      console.error('Upload error:', error);
      setErrors({ 
        upload: error instanceof Error ? error.message : 'Failed to upload to Arweave' 
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Campaign Content
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Add details and media for your campaign
        </p>
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Campaign Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => updateFormData({ description: e.target.value })}
          rows={8}
          className={`w-full px-4 py-3 border rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.description
              ? 'border-red-500'
              : 'border-gray-300 dark:border-gray-600'
          }`}
          placeholder="Describe your project in detail. What are you building? Why is it important? How will the funds be used?"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.description}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {formData.description.length} characters (minimum 50)
        </p>
      </div>

      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Media Files (Images/Videos) <span className="text-red-500">*</span>
        </label>
        
        {/* Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : errors.files
              ? 'border-red-500'
              : 'border-gray-300 dark:border-gray-600'
          }`}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-700 dark:text-gray-300 mb-2">
            Drag and drop files here, or{' '}
            <label className="text-blue-600 hover:text-blue-700 cursor-pointer">
              browse
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
              />
            </label>
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Max {MAX_FILES_COUNT} files, 10 MB total (images and videos only)
          </p>
        </div>

        {errors.files && (
          <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.files}
          </p>
        )}

        {/* File List */}
        {formData.files.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
              <span>{formData.files.length} file(s) selected</span>
              <span>Total: {formattedSize(totalSize)} / 10 MB</span>
            </div>
            <div className="space-y-2">
              {formData.files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {file.type.startsWith('image/') ? (
                      <FileImage className="w-5 h-5 text-blue-500" />
                    ) : (
                      <FileVideo className="w-5 h-5 text-purple-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[300px]">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">{formattedSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Upload Error */}
      {errors.upload && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {errors.upload}
          </p>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Uploading to Arweave... {uploadProgress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
            Please wait while we permanently store your campaign content...
          </p>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
          🌐 Permanent Storage
        </h4>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Your campaign content will be permanently stored on Arweave. This ensures your campaign
          details remain accessible forever, even if our platform goes offline. Storage costs are
          covered by the platform.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onBack}
          disabled={uploading}
          className="px-8 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Uploading...
            </>
          ) : (
            'Continue to Review →'
          )}
        </button>
      </div>
    </div>
  );
}
