import { NextRequest, NextResponse } from 'next/server';
import { TurboFactory, EthereumSigner } from '@ardrive/turbo-sdk/node';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB total limit

// Convert hex string private key to Uint8Array (32 bytes)
function hexToBytes(hex: string): Uint8Array {
    // Remove 0x prefix if present
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    const bytes = new Uint8Array(32);
    for (let i = 0; i < 64; i += 2) {
        bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
    }
    return bytes;
}

export async function POST(request: NextRequest) {
    try {
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

        // Upload media files to Turbo first
        const mediaUrls: string[] = [];

        if (files.length > 0) {
            const walletAddress = process.env.TURBO_WALLET_ADDRESS;
            const privateKey = process.env.TURBO_WALLET_PRIVATE_KEY;

            if (!walletAddress || !privateKey) {
                return NextResponse.json(
                    { error: 'Turbo wallet not configured properly. Need both address and private key.' },
                    { status: 500 }
                );
            }

            // Use privateKey directly with TurboFactory for Ethereum wallets
            const privateKeyBytes = hexToBytes(privateKey);
            const signer = new EthereumSigner(privateKeyBytes as unknown as string);
            const turbo = TurboFactory.authenticated({
                signer,
                token: 'ethereum'
            });

            for (const file of files) {
                const buffer = await file.arrayBuffer();
                const uploadResult = await turbo.uploadFile({
                    fileStreamFactory: () => Buffer.from(buffer),
                    fileSizeFactory: () => file.size,
                    dataItemOpts: {
                        tags: [
                            { name: 'Content-Type', value: file.type },
                            { name: 'App-Name', value: 'CrowdFunding' },
                            { name: 'File-Type', value: 'campaign-media' },
                        ],
                    },
                });

                mediaUrls.push(`https://arweave.net/${uploadResult.id}`);
            }
        }

        // Create campaign content JSON
        const campaignContent = {
            title,
            details: description,
            media: mediaUrls,
            timestamp: Date.now(),
            version: '1.0',
        };

        // Upload campaign content JSON to Turbo
        const walletAddress = process.env.TURBO_WALLET_ADDRESS;
        const privateKey = process.env.TURBO_WALLET_PRIVATE_KEY;

        if (!walletAddress || !privateKey) {
            return NextResponse.json(
                { error: 'Turbo wallet not configured properly' },
                { status: 500 }
            );
        }

        // Use privateKey directly with TurboFactory for Ethereum wallets
        const privateKeyBytes = hexToBytes(privateKey);
        const signer = new EthereumSigner(privateKeyBytes as unknown as string);
        const turbo = TurboFactory.authenticated({
            signer,
            token: 'ethereum'
        });

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
            totalSize: (totalSize / 1024).toFixed(2) + ' KB',
        });

    } catch (error: any) {
        console.error('Arweave upload error:', error);
        return NextResponse.json(
            {
                error: 'Failed to upload to Arweave',
                details: error.message
            },
            { status: 500 }
        );
    }
}
