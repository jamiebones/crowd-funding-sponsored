import { NextRequest, NextResponse } from 'next/server';
import { TurboFactory } from '@ardrive/turbo-sdk';
import { EthereumSigner } from '@ardrive/turbo-sdk/web';

export async function GET(request: NextRequest) {
    try {
        // For Ethereum wallets with Turbo credits, use the wallet address
        const walletAddress = process.env.TURBO_WALLET_ADDRESS;

        if (!walletAddress) {
            return NextResponse.json(
                {
                    error: 'Turbo wallet address not configured',
                    hint: 'Set TURBO_WALLET_ADDRESS to your Ethereum wallet address that has Turbo credits'
                },
                { status: 500 }
            );
        }

        // Try authenticated approach if private key is available
        const privateKey = process.env.TURBO_WALLET_PRIVATE_KEY;

        let balance;
        let method = 'unauthenticated';

        if (privateKey) {
            try {
                // Use EthereumSigner for Ethereum wallets
                const signer = new EthereumSigner(privateKey);
                const turbo = TurboFactory.authenticated({ signer } as any);
                balance = await turbo.getBalance();
                method = 'authenticated (Ethereum)';
            } catch (authError: any) {
                console.log('Authenticated method failed, trying unauthenticated:', authError.message);
                // Fall back to unauthenticated
                const turbo = TurboFactory.unauthenticated();
                balance = await turbo.getBalance({ owner: walletAddress });
            }
        } else {
            // No private key, use unauthenticated
            const turbo = TurboFactory.unauthenticated();
            balance = await turbo.getBalance({ owner: walletAddress });
        }

        return NextResponse.json({
            walletAddress: walletAddress,
            method: method,
            balance: balance.winc,
            balanceUSD: (parseFloat(balance.winc) / 1e12).toFixed(2),
            warningThreshold: 100000000000,
            needsTopup: parseFloat(balance.winc) < 100000000000,
            note: 'If balance is 0, verify: 1) Correct wallet address, 2) Credits processed on turbo.ardrive.io, 3) Private key configured'
        });

    } catch (error: any) {
        console.error('Balance check error:', error);
        return NextResponse.json(
            {
                error: 'Failed to check balance',
                details: error.message
            },
            { status: 500 }
        );
    }
}
