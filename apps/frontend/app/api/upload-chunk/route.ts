import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
import TempChunk from '@/lib/db/models/TempChunk';

const MAX_CHUNK_SIZE = 3 * 1024 * 1024; // 3MB per chunk (safely under 4.5MB Vercel limit)

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        const uploadId = formData.get('uploadId') as string;
        const chunkIndex = parseInt(formData.get('chunkIndex') as string, 10);
        const totalChunks = parseInt(formData.get('totalChunks') as string, 10);
        const chunk = formData.get('chunk') as File;
        const fileName = formData.get('fileName') as string;
        const fileType = formData.get('fileType') as string;

        // Validation
        if (!uploadId || isNaN(chunkIndex) || isNaN(totalChunks) || !chunk) {
            return NextResponse.json(
                { error: 'Missing required fields: uploadId, chunkIndex, totalChunks, chunk' },
                { status: 400 }
            );
        }

        if (chunk.size > MAX_CHUNK_SIZE) {
            return NextResponse.json(
                { error: `Chunk size exceeds ${MAX_CHUNK_SIZE / 1024 / 1024}MB limit` },
                { status: 400 }
            );
        }

        // Connect to MongoDB
        await connectDB();

        // Convert chunk to Buffer
        const arrayBuffer = await chunk.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Store chunk in MongoDB (upsert to handle retries)
        await TempChunk.findOneAndUpdate(
            { uploadId, chunkIndex },
            {
                uploadId,
                chunkIndex,
                totalChunks,
                fileName,
                fileType,
                data: buffer,
                createdAt: new Date()
            },
            { upsert: true, new: true }
        );

        // Check how many chunks have been received
        const receivedCount = await TempChunk.countDocuments({ uploadId });

        return NextResponse.json({
            success: true,
            uploadId,
            chunkIndex,
            receivedChunks: receivedCount,
            totalChunks,
            complete: receivedCount === totalChunks
        });

    } catch (error: any) {
        console.error('Chunk upload error:', error);
        return NextResponse.json(
            { error: 'Failed to upload chunk', details: error.message },
            { status: 500 }
        );
    }
}
