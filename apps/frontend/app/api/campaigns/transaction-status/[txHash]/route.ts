import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
import PendingTransaction from '@/lib/db/models/PendingTransaction';

/**
 * GET /api/campaigns/transaction-status/[txHash] - Check transaction status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ txHash: string }> }
) {
  try {
    await connectDB();

    const { txHash } = await params;

    const transaction = await PendingTransaction.findOne({ txHash }).lean();

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      transaction
    });
  } catch (error) {
    console.error('Error fetching transaction status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transaction status' },
      { status: 500 }
    );
  }
}
