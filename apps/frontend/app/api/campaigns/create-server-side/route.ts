import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
import ServerWallet from '@/lib/db/models/ServerWallet';
import WalletAuditLog from '@/lib/db/models/WalletAuditLog';
import PendingTransaction from '@/lib/db/models/PendingTransaction';
import { createWalletFromEncryptedKey, waitForTransaction } from '@/lib/services/walletService';
import { encodeFunctionData, parseEther } from 'viem';
import FactoryABI from '@/abis/CrowdFundingFactory.json';
import { FACTORY_ADDRESS } from '@/lib/constants';

interface CreateCampaignRequest {
  walletAddress: string;
  arweaveTxId: string;
  category: number;
  title: string;
  goal: string; // BNB amount as string
  duration: number; // in days
  performedBy?: string;
}

/**
 * POST /api/campaigns/create-server-side - Create campaign using server wallet
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body: CreateCampaignRequest = await request.json();
    const { walletAddress, arweaveTxId, category, title, goal, duration, performedBy } = body;

    // Validate inputs
    if (!walletAddress || !arweaveTxId || category === undefined || !title || !goal || !duration) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (category < 0 || category > 8) {
      return NextResponse.json(
        { success: false, error: 'Invalid category (must be 0-8)' },
        { status: 400 }
      );
    }

    if (duration <= 0) {
      return NextResponse.json(
        { success: false, error: 'Duration must be positive' },
        { status: 400 }
      );
    }

    // Find server wallet
    const wallet = await ServerWallet.findOne({
      address: walletAddress.toLowerCase(),
      isActive: true
    });

    if (!wallet) {
      return NextResponse.json(
        { success: false, error: 'Wallet not found or inactive' },
        { status: 404 }
      );
    }

    // Create wallet client from encrypted key
    const { walletClient, account } = createWalletFromEncryptedKey(
      wallet.encryptedPrivateKey,
      wallet.salt
    );

    // Get current funding fee from contract
    let platformFee: bigint;
    try {
      const { createPublicBscClient } = await import('@/lib/services/walletService');
      const publicClient = createPublicBscClient();
      platformFee = await publicClient.readContract({
        address: FACTORY_ADDRESS,
        abi: FactoryABI.abi,
        functionName: 'getFundingFee'
      }) as bigint;
    } catch (error) {
      console.error('Failed to get funding fee, using default:', error);
      platformFee = parseEther('0.000000001'); // Fallback
    }

    // Check if wallet has sufficient balance
    const { getWalletBalance } = await import('@/lib/services/walletService');
    const currentBalanceStr = await getWalletBalance(wallet.address);
    const currentBalance = parseEther(currentBalanceStr);
    const requiredBalance = platformFee;

    if (currentBalance < requiredBalance) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient balance',
          details: {
            required: requiredBalance.toString(),
            current: currentBalance.toString()
          }
        },
        { status: 400 }
      );
    }

    // Prepare transaction parameters
    const durationInSeconds = BigInt(duration * 24 * 60 * 60);
    const goalInWei = parseEther(goal);

    console.log('Creating campaign with params:', {
      detailsId: arweaveTxId,
      category,
      title,
      goal: goalInWei.toString(),
      duration: durationInSeconds.toString(),
      fee: platformFee.toString()
    });

    // Send transaction
    let txHash: `0x${string}`;
    try {
      txHash = await walletClient.writeContract({
        address: FACTORY_ADDRESS,
        abi: FactoryABI.abi,
        functionName: 'createNewCrowdFundingContract',
        args: [arweaveTxId, category, title, goalInWei, durationInSeconds],
        value: platformFee,
        account,
        chain: walletClient.chain
      });

      console.log('Transaction sent:', txHash);
    } catch (error) {
      console.error('Transaction failed:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Transaction failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    // Create pending transaction record and audit log in parallel
    const [pendingTx] = await Promise.all([
      PendingTransaction.create({
        txHash,
        walletAddress: wallet.address,
        type: 'CAMPAIGN_CREATION',
        status: 'PENDING',
        metadata: {
          arweaveTxId,
          title,
          category,
          goal,
          duration
        }
      }),
      WalletAuditLog.create({
        walletAddress: wallet.address,
        action: 'TRANSACTION_SIGNED',
        txHash,
        metadata: {
          type: 'campaign_creation',
          title,
          arweaveTxId
        },
        performedBy: performedBy || 'SYSTEM'
      })
    ]);

    // Wait for transaction confirmation in background (don't block response)
    waitForTransaction(txHash, 120000)
      .then(async (receipt) => {
        console.log('Transaction confirmed:', receipt);

        // Extract campaign address from event logs
        let campaignAddress: string | null = null;

        if (receipt.logs && receipt.logs.length > 0) {
          // Find NewCrowdFundingContractCreated event
          const event = receipt.logs.find((log: any) =>
            log.topics[0] === '0x...' // Event signature - you'll need to add this
          );

          if (event && event.topics[1]) {
            campaignAddress = `0x${event.topics[1].slice(26)}`; // Extract address from indexed parameter
          }
        }

        // Increment campaign count
        wallet.campaignCount += 1;

        // Update pending transaction, save wallet, and create audit log in parallel
        await Promise.all([
          PendingTransaction.findOneAndUpdate(
            { txHash },
            {
              status: 'CONFIRMED',
              blockNumber: Number(receipt.blockNumber),
              gasUsed: receipt.gasUsed?.toString(),
              confirmedAt: new Date(),
              'metadata.campaignAddress': campaignAddress
            }
          ),
          wallet.save(),
          WalletAuditLog.create({
            walletAddress: wallet.address,
            action: 'CAMPAIGN_CREATED',
            txHash,
            metadata: {
              campaignAddress,
              title,
              arweaveTxId
            },
            performedBy: performedBy || 'SYSTEM'
          })
        ]);
      })
      .catch(async (error) => {
        console.error('Transaction confirmation failed:', error);

        // Update pending transaction
        await PendingTransaction.findOneAndUpdate(
          { txHash },
          {
            status: 'FAILED',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            confirmedAt: new Date()
          }
        );
      });

    // Return immediately with transaction hash
    return NextResponse.json({
      success: true,
      txHash,
      message: 'Campaign creation transaction submitted',
      pendingTransactionId: pendingTx._id
    }, { status: 202 }); // 202 Accepted - processing async
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create campaign',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
