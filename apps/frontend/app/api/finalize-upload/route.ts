import { NextRequest, NextResponse } from 'next/server';
import { TurboFactory, EthereumSigner } from '@ardrive/turbo-sdk/node';
import connectDB from '@/lib/db/connection';
import TempChunk from '@/lib/db/models/TempChunk';

const MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10MB total limit

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

        const mediaUrls: string[] = [];
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
            if (completeBuffer.length > MAX_TOTAL_SIZE) {
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
                        { name: 'File-Type', value: 'campaign-media' },
                        { name: 'Original-Name', value: fileName },
                    ],
                },
            });

            mediaUrls.push(`https://arweave.net/${uploadResult.id}`);

            // Clean up chunks after successful upload
            await TempChunk.deleteMany({ uploadId });
        }

        // Create campaign content JSON
        const campaignContent = {
            title,
            details: description,
            media: mediaUrls,
            timestamp: Date.now(),
            version: '1.0',
        };

        // Upload campaign content JSON to Arweave
        const contentBuffer = Buffer.from(JSON.stringify(campaignContent));
        const uploadResult = await turbo.uploadFile({
            fileStreamFactory: () => contentBuffer,
            fileSizeFactory: () => contentBuffer.length,
            dataItemOpts: {
                tags: [
                    { name: 'Content-Type', value: 'application/json' },
                    { name: 'App-Name', value: 'CrowdFunding' },
                    { name: 'Data-Type', value: 'campaign-content' },
                    { name: 'Title', value: title },
                ],
            },
        });

        return NextResponse.json({
            success: true,
            transactionId: uploadResult.id,
            arweaveUrl: `https://arweave.net/${uploadResult.id}`,
            mediaCount: mediaUrls.length,
        });

    } catch (error: any) {
        console.error('Finalize upload error:', error);
        return NextResponse.json(
            {
                error: 'Failed to finalize upload',
                details: error.message
            },
            { status: 500 }
        );
    }
}
