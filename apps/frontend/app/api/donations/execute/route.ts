import { NextRequest, NextResponse } from 'next/server';
import { executePendingDonations } from '@/lib/crypto/donation-executor';

// This endpoint should be protected with an API key in production
// Call it via cron job (Vercel Cron, GitHub Actions, or external service)

const CRON_SECRET = process.env.CRON_SECRET || '';

export async function POST(request: NextRequest) {
    try {
        // Verify authorization
        const authHeader = request.headers.get('authorization');
        if (!authHeader || authHeader !== `Bearer ${CRON_SECRET}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        console.log('Executing pending donations...');

        // Execute all pending donations
        const result = await executePendingDonations();

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Execution failed' },
                { status: 500 }
            );
        }

        const { success, ...resultData } = result;

        return NextResponse.json({
            success: true,
            message: 'Donations executed successfully',
            ...resultData,
        });
    } catch (error: any) {
        console.error('Donation executor API error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

// GET endpoint to check status (for testing)
export async function GET(request: NextRequest) {
    try {
        // Verify authorization
        const authHeader = request.headers.get('authorization');
        if (!authHeader || authHeader !== `Bearer ${CRON_SECRET}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { checkTreasuryBalance } = await import('@/lib/crypto/donation-executor');
        const treasuryStatus = await checkTreasuryBalance();

        return NextResponse.json({
            treasury: treasuryStatus,
            endpoint: '/api/donations/execute',
            ready: treasuryStatus.sufficient,
        });
    } catch (error: any) {
        console.error('Status check error:', error);
        return NextResponse.json(
            { error: error.message || 'Status check failed' },
            { status: 500 }
        );
    }
}
