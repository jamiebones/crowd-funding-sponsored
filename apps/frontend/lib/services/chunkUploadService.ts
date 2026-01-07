/**
 * Chunk Upload Service
 * 
 * Handles uploading large files in chunks to bypass Vercel's 4.5MB limit.
 * Files are split into 2MB chunks, uploaded to MongoDB for temporary storage,
 * then reassembled and uploaded to Arweave.
 */

export const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB chunks (safely under 4.5MB Vercel limit)
export const MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10MB total per file
export const MAX_RETRIES = 3;
export const RETRY_DELAY = 1000; // 1 second

export interface UploadProgress {
    phase: 'chunking' | 'uploading' | 'finalizing' | 'complete' | 'error';
    progress: number; // 0-100
    currentFile?: string;
    currentChunk?: number;
    totalChunks?: number;
    message?: string;
}

export interface ChunkUploadResult {
    success: boolean;
    receivedChunks: number;
    totalChunks: number;
    complete: boolean;
}

export interface FinalizeUploadResult {
    success: boolean;
    transactionId: string;
    arweaveUrl: string;
    mediaCount: number;
}

export interface FileUploadInfo {
    uploadId: string;
    fileName: string;
    fileType: string;
}

/**
 * Generate a unique upload ID for tracking chunks
 */
export function generateUploadId(): string {
    return `upload_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Split a file into chunks of specified size
 */
export function splitFileIntoChunks(file: File, chunkSize: number = CHUNK_SIZE): Blob[] {
    const chunks: Blob[] = [];
    let offset = 0;

    while (offset < file.size) {
        const chunk = file.slice(offset, offset + chunkSize);
        chunks.push(chunk);
        offset += chunkSize;
    }

    return chunks;
}

/**
 * Calculate total number of chunks for all files
 */
export function calculateTotalChunks(files: File[], chunkSize: number = CHUNK_SIZE): number {
    return files.reduce((total, file) => {
        return total + Math.ceil(file.size / chunkSize);
    }, 0);
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Upload a single chunk with retry logic
 */
export async function uploadChunk(
    chunk: Blob,
    uploadId: string,
    chunkIndex: number,
    totalChunks: number,
    fileName: string,
    fileType: string,
    retries: number = MAX_RETRIES
): Promise<ChunkUploadResult> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const formData = new FormData();
            formData.append('uploadId', uploadId);
            formData.append('chunkIndex', chunkIndex.toString());
            formData.append('totalChunks', totalChunks.toString());
            formData.append('fileName', fileName);
            formData.append('fileType', fileType);
            formData.append('chunk', chunk);

            const response = await fetch('/api/upload-chunk', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || `Chunk upload failed with status ${response.status}`);
            }

            return response.json();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            console.warn(`Chunk upload attempt ${attempt + 1} failed:`, lastError.message);

            if (attempt < retries - 1) {
                await sleep(RETRY_DELAY * (attempt + 1)); // Exponential backoff
            }
        }
    }

    throw lastError || new Error('Chunk upload failed after retries');
}

/**
 * Upload all chunks for a single file
 */
export async function uploadFileChunks(
    file: File,
    onProgress?: (chunkIndex: number, totalChunks: number) => void
): Promise<FileUploadInfo> {
    const uploadId = generateUploadId();
    const chunks = splitFileIntoChunks(file);

    for (let i = 0; i < chunks.length; i++) {
        await uploadChunk(
            chunks[i],
            uploadId,
            i,
            chunks.length,
            file.name,
            file.type
        );

        onProgress?.(i + 1, chunks.length);
    }

    return {
        uploadId,
        fileName: file.name,
        fileType: file.type,
    };
}

/**
 * Upload multiple files with progress tracking
 */
export async function uploadMultipleFiles(
    files: File[],
    onProgress?: (progress: UploadProgress) => void
): Promise<FileUploadInfo[]> {
    const uploadInfos: FileUploadInfo[] = [];
    const totalChunks = calculateTotalChunks(files);
    let completedChunks = 0;

    onProgress?.({
        phase: 'uploading',
        progress: 0,
        message: 'Starting upload...',
    });

    for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
        const file = files[fileIndex];

        onProgress?.({
            phase: 'uploading',
            progress: Math.round((completedChunks / totalChunks) * 100),
            currentFile: file.name,
            message: `Uploading ${file.name}...`,
        });

        const uploadInfo = await uploadFileChunks(file, (chunkIndex, fileChunks) => {
            completedChunks++;
            onProgress?.({
                phase: 'uploading',
                progress: Math.round((completedChunks / totalChunks) * 100),
                currentFile: file.name,
                currentChunk: chunkIndex,
                totalChunks: fileChunks,
                message: `Uploading ${file.name} (${chunkIndex}/${fileChunks})...`,
            });
        });

        uploadInfos.push(uploadInfo);
    }

    return uploadInfos;
}

/**
 * Finalize upload - reassemble chunks and upload to Arweave
 */
export async function finalizeUpload(
    title: string,
    description: string,
    uploadIds: FileUploadInfo[]
): Promise<FinalizeUploadResult> {
    const response = await fetch('/api/finalize-upload', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            title,
            description,
            uploadIds,
        }),
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Server returned non-JSON response (${response.status}): ${text.slice(0, 100)}...`);
    }

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || 'Finalize upload failed');
    }

    return result;
}

/**
 * Complete upload flow - upload chunks and finalize
 * This is the main function to use for uploading campaign content
 */
export async function uploadCampaignContent(
    title: string,
    description: string,
    files: File[],
    onProgress?: (progress: UploadProgress) => void
): Promise<FinalizeUploadResult> {
    try {
        // Validate total size
        const totalSize = files.reduce((acc, file) => acc + file.size, 0);
        if (totalSize > MAX_TOTAL_SIZE * files.length) {
            throw new Error(`Total file size exceeds limit`);
        }

        // Phase 1: Upload all file chunks
        onProgress?.({
            phase: 'uploading',
            progress: 0,
            message: 'Preparing upload...',
        });

        const uploadInfos = await uploadMultipleFiles(files, (progress) => {
            onProgress?.({
                ...progress,
                // Scale to 0-80% for chunk uploads
                progress: Math.round(progress.progress * 0.8),
            });
        });

        // Phase 2: Finalize - reassemble and upload to Arweave
        onProgress?.({
            phase: 'finalizing',
            progress: 85,
            message: 'Uploading to Arweave...',
        });

        const result = await finalizeUpload(title, description, uploadInfos);

        onProgress?.({
            phase: 'complete',
            progress: 100,
            message: 'Upload complete!',
        });

        return result;
    } catch (error) {
        onProgress?.({
            phase: 'error',
            progress: 0,
            message: error instanceof Error ? error.message : 'Upload failed',
        });
        throw error;
    }
}

/**
 * Upload milestone content with chunked upload
 */
export async function uploadMilestoneContent(
    milestoneDescription: string,
    files: File[],
    onProgress?: (progress: UploadProgress) => void
): Promise<{ transactionId: string; arweaveUrl: string }> {
    try {
        // Upload file chunks
        onProgress?.({
            phase: 'uploading',
            progress: 0,
            message: 'Preparing milestone upload...',
        });

        const uploadInfos = await uploadMultipleFiles(files, (progress) => {
            onProgress?.({
                ...progress,
                progress: Math.round(progress.progress * 0.8),
            });
        });

        // Finalize milestone upload
        onProgress?.({
            phase: 'finalizing',
            progress: 85,
            message: 'Uploading milestone to Arweave...',
        });

        const response = await fetch('/api/finalize-milestone-upload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                description: milestoneDescription,
                uploadIds: uploadInfos,
            }),
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(`Server returned non-JSON response (${response.status}): ${text.slice(0, 100)}...`);
        }

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Milestone upload failed');
        }

        onProgress?.({
            phase: 'complete',
            progress: 100,
            message: 'Milestone upload complete!',
        });

        return result;
    } catch (error) {
        onProgress?.({
            phase: 'error',
            progress: 0,
            message: error instanceof Error ? error.message : 'Milestone upload failed',
        });
        throw error;
    }
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Validate files before upload
 */
export function validateFiles(
    files: File[],
    options: {
        maxTotalSize?: number;
        maxFileCount?: number;
        allowedTypes?: string[];
    } = {}
): { valid: boolean; error?: string } {
    const {
        maxTotalSize = MAX_TOTAL_SIZE,
        maxFileCount = 10,
        allowedTypes = ['image/', 'video/'],
    } = options;

    if (files.length > maxFileCount) {
        return { valid: false, error: `Maximum ${maxFileCount} files allowed` };
    }

    const totalSize = files.reduce((acc, file) => acc + file.size, 0);
    if (totalSize > maxTotalSize) {
        return {
            valid: false,
            error: `Total size cannot exceed ${formatBytes(maxTotalSize)} (${formatBytes(totalSize)} selected)`,
        };
    }

    for (const file of files) {
        const isAllowed = allowedTypes.some(type => file.type.startsWith(type));
        if (!isAllowed) {
            return {
                valid: false,
                error: `File type "${file.type}" is not allowed. Only ${allowedTypes.join(', ')} files are accepted.`,
            };
        }
    }

    return { valid: true };
}
