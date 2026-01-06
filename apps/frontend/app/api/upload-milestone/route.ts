import { NextRequest, NextResponse } from 'next/server';
import { TurboFactory, EthereumSigner } from '@ardrive/turbo-sdk/node';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB total limit

// Ensure private key has 0x prefix for Ethereum
function normalizePrivateKey(key: string): string {
    return key.startsWith('0x') ? key : `0x${key}`;
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

        // Upload proof files to Turbo first
        const proofUrls: string[] = [];

        if (files.length > 0) {
            const walletAddress = process.env.TURBO_WALLET_ADDRESS;
            const privateKey = process.env.TURBO_WALLET_PRIVATE_KEY;

            if (!walletAddress || !privateKey) {
                return NextResponse.json(
                    { error: 'Turbo wallet not configured properly. Need both address and private key.' },
                    { status: 500 }
                );
            }

            // Use EthereumSigner with hex string for Ethereum wallets
            const normalizedKey = normalizePrivateKey(privateKey);
            const signer = new EthereumSigner(normalizedKey);
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
        const walletAddress = process.env.TURBO_WALLET_ADDRESS;
        const privateKey = process.env.TURBO_WALLET_PRIVATE_KEY;

        if (!walletAddress || !privateKey) {
            return NextResponse.json(
                { error: 'Turbo wallet not configured' },
                { status: 500 }
            );
        }

        // Use EthereumSigner with hex string for Ethereum wallets
        const normalizedKey = normalizePrivateKey(privateKey);
        const signer = new EthereumSigner(normalizedKey);
        const turbo = TurboFactory.authenticated({
            signer,
            token: 'ethereum'
        });

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
