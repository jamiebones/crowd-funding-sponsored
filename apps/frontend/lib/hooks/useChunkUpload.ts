import { useState, useCallback } from 'react';
import {
    uploadCampaignContent,
    uploadMilestoneContent,
    UploadProgress,
    FinalizeUploadResult,
    validateFiles,
} from '@/lib/services/chunkUploadService';

export interface UseChunkUploadReturn {
    // State
    isUploading: boolean;
    progress: UploadProgress | null;
    error: string | null;
    result: FinalizeUploadResult | null;

    // Actions
    uploadCampaign: (
        title: string,
        description: string,
        files: File[]
    ) => Promise<FinalizeUploadResult | null>;
    uploadMilestone: (
        description: string,
        files: File[]
    ) => Promise<{ transactionId: string; arweaveUrl: string } | null>;
    reset: () => void;
}

/**
 * React hook for handling chunked file uploads
 * 
 * @example
 * ```tsx
 * const { uploadCampaign, isUploading, progress, error } = useChunkUpload();
 * 
 * const handleSubmit = async () => {
 *   const result = await uploadCampaign(title, description, files);
 *   if (result) {
 *     console.log('Uploaded to:', result.arweaveUrl);
 *   }
 * };
 * ```
 */
export function useChunkUpload(): UseChunkUploadReturn {
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState<UploadProgress | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<FinalizeUploadResult | null>(null);

    const reset = useCallback(() => {
        setIsUploading(false);
        setProgress(null);
        setError(null);
        setResult(null);
    }, []);

    const uploadCampaign = useCallback(
        async (
            title: string,
            description: string,
            files: File[]
        ): Promise<FinalizeUploadResult | null> => {
            // Reset state
            setError(null);
            setResult(null);
            setProgress(null);

            // Validate inputs
            if (!title.trim()) {
                setError('Title is required');
                return null;
            }

            if (!description.trim()) {
                setError('Description is required');
                return null;
            }

            // Validate files
            const validation = validateFiles(files);
            if (!validation.valid) {
                setError(validation.error || 'Invalid files');
                return null;
            }

            setIsUploading(true);

            try {
                const uploadResult = await uploadCampaignContent(
                    title,
                    description,
                    files,
                    setProgress
                );

                setResult(uploadResult);
                return uploadResult;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Upload failed';
                setError(errorMessage);
                return null;
            } finally {
                setIsUploading(false);
            }
        },
        []
    );

    const uploadMilestone = useCallback(
        async (
            description: string,
            files: File[]
        ): Promise<{ transactionId: string; arweaveUrl: string } | null> => {
            // Reset state
            setError(null);
            setResult(null);
            setProgress(null);

            // Validate inputs
            if (!description.trim()) {
                setError('Milestone description is required');
                return null;
            }

            // Validate files (optional for milestones)
            if (files.length > 0) {
                const validation = validateFiles(files);
                if (!validation.valid) {
                    setError(validation.error || 'Invalid files');
                    return null;
                }
            }

            setIsUploading(true);

            try {
                const uploadResult = await uploadMilestoneContent(
                    description,
                    files,
                    setProgress
                );

                return uploadResult;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Upload failed';
                setError(errorMessage);
                return null;
            } finally {
                setIsUploading(false);
            }
        },
        []
    );

    return {
        isUploading,
        progress,
        error,
        result,
        uploadCampaign,
        uploadMilestone,
        reset,
    };
}

export default useChunkUpload;
