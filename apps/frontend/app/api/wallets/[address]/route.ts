import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
import ServerWallet from '@/lib/db/models/ServerWallet';
import WalletAuditLog from '@/lib/db/models/WalletAuditLog';
import PendingTransaction from '@/lib/db/models/PendingTransaction';


/**
 * GET /api/wallets/[address] - Get single wallet details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    await connectDB();

    const resolvedParams = await params;
    const address = resolvedParams.address.toLowerCase();

    // Fetch wallet, audit logs, and pending transactions in parallel
    const [wallet, auditLogs, pendingTxs] = await Promise.all([
      ServerWallet.findOne({ address })
        .select('-encryptedPrivateKey -salt')
        .lean(),
      WalletAuditLog.find({ walletAddress: address })
        .sort({ timestamp: -1 })
        .limit(10)
        .lean(),
      PendingTransaction.find({
        walletAddress: address,
        status: 'PENDING'
      })
        .sort({ createdAt: -1 })
        .lean()
    ]);

    if (!wallet) {
      return NextResponse.json(
        { success: false, error: 'Wallet not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      wallet,
      auditLogs,
      pendingTransactions: pendingTxs
    });
  } catch (error) {
    console.error('Error fetching wallet:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch wallet' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/wallets/[address] - Update wallet (activate/deactivate)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    await connectDB();

    const resolvedParams = await params;
    const address = resolvedParams.address.toLowerCase();
    const body = await request.json();
    const { isActive, performedBy } = body;

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'isActive must be a boolean' },
        { status: 400 }
      );
    }

    const wallet = await ServerWallet.findOne({ address });

    if (!wallet) {
      return NextResponse.json(
        { success: false, error: 'Wallet not found' },
        { status: 404 }
      );
    }

    wallet.isActive = isActive;

    // Save wallet and create audit log in parallel
    await Promise.all([
      wallet.save(),
      WalletAuditLog.create({
        walletAddress: address,
        action: isActive ? 'REACTIVATED' : 'DEACTIVATED',
        metadata: {},
        performedBy: performedBy || 'SYSTEM'
      })
    ]);

    return NextResponse.json({
      success: true,
      wallet: {
        address: wallet.address,
        isActive: wallet.isActive,
        campaignCount: wallet.campaignCount
      },
      message: `Wallet ${isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Error updating wallet:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update wallet' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/wallets/[address] - Delete wallet (only if no campaigns attached)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    await connectDB();

    const resolvedParams = await params;
    const address = resolvedParams.address.toLowerCase();
    const { searchParams } = new URL(request.url);
    const performedBy = searchParams.get('performedBy') || 'SYSTEM';

    const wallet = await ServerWallet.findOne({ address });

    if (!wallet) {
      return NextResponse.json(
        { success: false, error: 'Wallet not found' },
        { status: 404 }
      );
    }

    // Check if wallet has campaigns attached
    if (wallet.campaignCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete wallet with ${wallet.campaignCount} campaign(s) attached. Please reassign or complete campaigns first.`
        },
        { status: 400 }
      );
    }

    // Create audit log before deleting
    await WalletAuditLog.create({
      walletAddress: address,
      action: 'DELETED',
      metadata: { reason: 'Deleted via API', campaignCount: wallet.campaignCount },
      performedBy
    });

    // Actually delete the wallet from database
    await ServerWallet.deleteOne({ address });

    return NextResponse.json({
      success: true,
      message: 'Wallet deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting wallet:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete wallet' },
      { status: 500 }
    );
  }
}
