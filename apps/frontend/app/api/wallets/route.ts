import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
import ServerWallet from '@/lib/db/models/ServerWallet';
import WalletAuditLog from '@/lib/db/models/WalletAuditLog';
import { encryptPrivateKeyToString, validatePrivateKey } from '@/lib/services/encryptionService';
import { privateKeyToAccount } from 'viem/accounts';

/**
 * GET /api/wallets - List all server wallets
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const query = activeOnly ? { isActive: true } : {};

    const wallets = await ServerWallet.find(query)
      .select('-encryptedPrivateKey -salt') // Never expose encrypted keys in API
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      wallets,
      count: wallets.length
    });
  } catch (error) {
    console.error('Error fetching wallets:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch wallets' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/wallets - Create/import a new server wallet
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { privateKey, performedBy } = body;

    // Validate input
    if (!privateKey) {
      return NextResponse.json(
        { success: false, error: 'Private key is required' },
        { status: 400 }
      );
    }

    if (!validatePrivateKey(privateKey)) {
      return NextResponse.json(
        { success: false, error: 'Invalid private key format' },
        { status: 400 }
      );
    }

    // Derive address from private key
    const account = privateKeyToAccount(
      (privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`) as `0x${string}`
    );
    const address = account.address.toLowerCase();

    // Check if wallet already exists
    const existingWallet = await ServerWallet.findOne({ address });
    if (existingWallet) {
      return NextResponse.json(
        { success: false, error: 'Wallet already exists' },
        { status: 409 }
      );
    }

    // Encrypt private key
    const { encryptedString, salt } = encryptPrivateKeyToString(privateKey);

    // Create wallet record and audit log in parallel
    const [wallet] = await Promise.all([
      ServerWallet.create({
        address,
        encryptedPrivateKey: encryptedString,
        salt,
        campaignCount: 0,
        isActive: true
      }),
      WalletAuditLog.create({
        walletAddress: address,
        action: 'CREATED',
        metadata: {},
        performedBy: performedBy || 'SYSTEM'
      })
    ]);

    // Return wallet without sensitive data
    const walletResponse = {
      address: wallet.address,
      campaignCount: wallet.campaignCount,
      isActive: wallet.isActive,
      createdAt: wallet.createdAt
    };

    return NextResponse.json({
      success: true,
      wallet: walletResponse,
      message: 'Wallet imported successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating wallet:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create wallet',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
