import { NextRequest, NextResponse } from 'next/server';
import { TurboFactory, EthereumSigner } from '@ardrive/turbo-sdk/node';
import connectDB from '@/lib/db/connection';
import TempChunk from '@/lib/db/models/TempChunk';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB total limit

// Ensure private key has 0x prefix for Ethereum
function normalizePrivateKey(key: string): string {
    return key.startsWith('0x') ? key : `0x${key}`;
}

// Helper to get authenticated Turbo client
function getTurboClient() {
    const walletAddress = process.env.TURBO_WALLET_ADDRESS;
    const privateKey = process.env.TURBO_WALLET_PRIVATE_KEY;

    if (!walletAddress || !privateKey) {
        throw new Error('Turbo wallet not configured properly. Need both address and private key.');
    }

    const normalizedKey = normalizePrivateKey(privateKey);
    const signer = new EthereumSigner(normalizedKey);
    return TurboFactory.authenticated({
        signer,
        token: 'ethereum'
    });
}

export async function POST(request: NextRequest) {
    try {
        const contentType = request.headers.get('content-type') || '';

        // Check if this is a JSON request (chunked upload) or FormData (legacy)
        if (contentType.includes('application/json')) {
            // New chunked upload flow
            return handleChunkedUpload(request);
        } else {
            // Legacy FormData upload (for small files or backward compatibility)
            return handleLegacyUpload(request);
        }
    } catch (error: any) {
        console.error('Milestone upload error:', error);
        return NextResponse.json(
            {
                error: 'Failed to upload milestone',
                details: error.message,
            },
            { status: 500 }
        );
    }
}

// Handle chunked upload - files were uploaded in chunks and stored in MongoDB
async function handleChunkedUpload(request: NextRequest) {
    const body = await request.json();

    const { title, description, uploadIds } = body as {
        title: string;
        description: string;
        uploadIds: Array<{ uploadId: string; fileName: string; fileType: string }>;
    };

    // Validation
    if (!title || !description) {
        return NextResponse.json(
            { error: 'Title and description are required' },
            { status: 400 }
        );
    }

    // Connect to MongoDB
    await connectDB();

    const proofUrls: string[] = [];
    const turbo = getTurboClient();

    // Process each file's chunks
    for (const fileInfo of uploadIds || []) {
        const { uploadId, fileName, fileType } = fileInfo;

        // Fetch all chunks for this file, sorted by index
        const chunks = await TempChunk.find({ uploadId }).sort({ chunkIndex: 1 });

        if (chunks.length === 0) {
            return NextResponse.json(
                { error: `No chunks found for uploadId: ${uploadId}` },
                { status: 400 }
            );
        }

        // Verify all chunks are present
        const expectedTotal = chunks[0].totalChunks;
        if (chunks.length !== expectedTotal) {
            return NextResponse.json(
                { error: `Missing chunks for ${fileName}. Expected ${expectedTotal}, got ${chunks.length}` },
                { status: 400 }
            );
        }

        // Reassemble the file from chunks
        const fileBuffers = chunks.map(chunk => chunk.data);
        const completeBuffer = Buffer.concat(fileBuffers);

        // Check total size
        if (completeBuffer.length > MAX_FILE_SIZE) {
            // Clean up chunks before returning error
            await TempChunk.deleteMany({ uploadId });
            return NextResponse.json(
                { error: `File ${fileName} exceeds 10MB limit` },
                { status: 400 }
            );
        }

        // Upload reassembled file to Arweave
        const uploadResult = await turbo.uploadFile({
            fileStreamFactory: () => completeBuffer,
            fileSizeFactory: () => completeBuffer.length,
            dataItemOpts: {
                tags: [
                    { name: 'Content-Type', value: fileType || 'application/octet-stream' },
                    { name: 'App-Name', value: 'CrowdFunding' },
                    { name: 'File-Type', value: 'milestone-proof' },
                    { name: 'Original-Name', value: fileName },
                ],
            },
        });

        proofUrls.push(`https://arweave.net/${uploadResult.id}`);

        // Clean up chunks after successful upload
        await TempChunk.deleteMany({ uploadId });
    }

    // Create milestone content object
    const milestoneContent = {
        title,
        description,
        proofUrls,
        createdAt: new Date().toISOString(),
    };

    // Upload milestone content JSON to Arweave
    const contentBuffer = Buffer.from(JSON.stringify(milestoneContent));
    const contentUpload = await turbo.uploadFile({
        fileStreamFactory: () => contentBuffer,
        fileSizeFactory: () => contentBuffer.length,
        dataItemOpts: {
            tags: [
                { name: 'Content-Type', value: 'application/json' },
                { name: 'App-Name', value: 'CrowdFunding' },
                { name: 'File-Type', value: 'milestone-content' },
            ],
        },
    });

    return NextResponse.json({
        success: true,
        milestoneCID: contentUpload.id,
        milestoneContent,
        proofCount: proofUrls.length,
    });
}

// Legacy FormData upload - for small files or backward compatibility
async function handleLegacyUpload(request: NextRequest) {
    const formData = await request.formData();

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const files = formData.getAll('files') as File[];

    // Validation
    if (!title || !description) {
        return NextResponse.json(
            { error: 'Title and description are required' },
            { status: 400 }
        );
    }

    // Calculate total size
    const totalSize = files.reduce((acc, file) => acc + file.size, 0);
    if (totalSize > MAX_FILE_SIZE) {
        return NextResponse.json(
            { error: `Total file size exceeds 10MB limit. Current: ${(totalSize / 1024 / 1024).toFixed(2)}MB` },
            { status: 400 }
        );
    }

    // Upload proof files to Turbo first
    const proofUrls: string[] = [];

    if (files.length > 0) {
        const turbo = getTurboClient();

        for (const file of files) {
            const buffer = await file.arrayBuffer();
            const uploadResult = await turbo.uploadFile({
                fileStreamFactory: () => Buffer.from(buffer),
                fileSizeFactory: () => file.size,
                dataItemOpts: {
                    tags: [
                        { name: 'Content-Type', value: file.type },
                        { name: 'App-Name', value: 'CrowdFunding' },
                        { name: 'File-Type', value: 'milestone-proof' },
                    ],
                },
            });

            const arweaveUrl = `https://arweave.net/${uploadResult.id}`;
            proofUrls.push(arweaveUrl);
        }
    }

    // Create milestone content object
    const milestoneContent = {
        title,
        description,
        proofUrls,
        createdAt: new Date().toISOString(),
    };

    // Upload milestone content JSON to Arweave
    const turbo = getTurboClient();
    const contentBuffer = Buffer.from(JSON.stringify(milestoneContent));
    const contentUpload = await turbo.uploadFile({
        fileStreamFactory: () => contentBuffer,
        fileSizeFactory: () => contentBuffer.length,
        dataItemOpts: {
            tags: [
                { name: 'Content-Type', value: 'application/json' },
                { name: 'App-Name', value: 'CrowdFunding' },
                { name: 'File-Type', value: 'milestone-content' },
            ],
        },
    });

    return NextResponse.json({
        success: true,
        milestoneCID: contentUpload.id,
        milestoneContent,
        proofCount: proofUrls.length,
    });
}
