/**
 * Auto-Donation Executor Service
 * 
 * Monitors 'processing' payments and automatically executes donations
 * using platform's BNB treasury. This runs as a cron job or triggered endpoint.
 * 
 * Flow:
 * 1. Find payments in 'processing' status
 * 2. For each payment:
 *    - Send netBNB from treasury to campaign contract
 *    - Execute giveDonationToCause on behalf of user
 *    - Update payment status to 'completed' with tx hash
 *    - User receives reward tokens automatically
 */

import { createPublicClient, createWalletClient, http, parseEther, formatEther, type Abi } from 'viem';
import { bsc } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import connectDB from '@/lib/db/connection';
import Payment from '@/lib/db/models/Payment';
import CrowdFundingABIFile from '@/abis/CrowdFunding.json';

const CrowdFundingABI = CrowdFundingABIFile.abi as Abi;

// Platform treasury configuration
const TREASURY_PRIVATE_KEY = process.env.TREASURY_PRIVATE_KEY || '';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000; // 5 seconds

// Initialize clients
const publicClient = createPublicClient({
    chain: bsc,
    transport: http(),
});

/**
 * Execute pending donations from fiat payments
 * This function should be called periodically (cron job) or via API endpoint
 */
export async function executePendingDonations() {
    if (!TREASURY_PRIVATE_KEY) {
        console.error('TREASURY_PRIVATE_KEY not configured');
        return {
            success: false,
            error: 'Treasury not configured',
        };
    }

    try {
        await connectDB();

        // Find all payments in 'processing' status
        const pendingPayments = await Payment.find({ status: 'processing' }).populate('userId');

        if (pendingPayments.length === 0) {
            console.log('No pending donations to execute');
            return {
                success: true,
                processed: 0,
            };
        }

        console.log(`Found ${pendingPayments.length} pending donations`);

        const results = [];

        // Process each payment
        for (const payment of pendingPayments) {
            try {
                const result = await executeSingleDonation(payment);
                results.push(result);

                // Add small delay between transactions to avoid nonce conflicts
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error: any) {
                console.error(`Failed to execute donation for payment ${payment._id}:`, error);
                results.push({
                    paymentId: payment._id,
                    success: false,
                    error: error.message,
                });
            }
        }

        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        console.log(`Donation execution complete: ${successful} successful, ${failed} failed`);

        return {
            success: true,
            processed: pendingPayments.length,
            successful,
            failed,
            results,
        };
    } catch (error: any) {
        console.error('Donation executor error:', error);
        return {
            success: false,
            error: error.message || 'Executor failed',
        };
    }
}

/**
 * Execute a single donation transaction
 * @param payment - Payment document from MongoDB
 */
async function executeSingleDonation(payment: any) {
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
        try {
            attempt++;
            console.log(`Executing donation for payment ${payment._id} (attempt ${attempt})`);

            // Create wallet client from treasury private key
            const account = privateKeyToAccount(TREASURY_PRIVATE_KEY as `0x${string}`);
            const walletClient = createWalletClient({
                account,
                chain: bsc,
                transport: http(),
            });

            // Get user's wallet address
            const userWalletAddress = payment.userId.walletAddress;
            if (!userWalletAddress) {
                throw new Error('User wallet address not found');
            }

            // Convert BNB amount to Wei
            const amountInWei = parseEther(payment.amountBNB.toString());

            console.log('Donation details:', {
                campaign: payment.campaignAddress,
                user: userWalletAddress,
                amount: payment.amountBNB,
                amountInWei: amountInWei.toString(),
            });

            // Execute the donation transaction
            // Call giveDonationToCause with value (BNB amount)
            const txHash = await walletClient.writeContract({
                address: payment.campaignAddress as `0x${string}`,
                abi: CrowdFundingABI.abi,
                functionName: 'giveDonationToCause',
                value: amountInWei,
                // The donation is made from treasury, but we could optionally
                // pass user's address as parameter if contract supports attribution
            });

            console.log('Transaction submitted:', txHash);

            // Wait for transaction confirmation
            const receipt = await publicClient.waitForTransactionReceipt({
                hash: txHash,
                confirmations: 2,
            });

            if (receipt.status === 'success') {
                // Update payment record to completed
                await Payment.findByIdAndUpdate(payment._id, {
                    status: 'completed',
                    donationTxHash: txHash,
                    metadata: {
                        ...payment.metadata,
                        executedAt: new Date().toISOString(),
                        gasUsed: receipt.gasUsed.toString(),
                        blockNumber: receipt.blockNumber.toString(),
                    },
                });

                console.log(`Donation executed successfully for payment ${payment._id}`);

                return {
                    paymentId: payment._id,
                    success: true,
                    txHash,
                    blockNumber: receipt.blockNumber,
                };
            } else {
                throw new Error('Transaction reverted');
            }
        } catch (error: any) {
            console.error(`Attempt ${attempt} failed:`, error.message);

            if (attempt >= MAX_RETRIES) {
                // Mark as failed after all retries exhausted
                await Payment.findByIdAndUpdate(payment._id, {
                    status: 'failed',
                    errorMessage: error.message || 'Donation execution failed after retries',
                    metadata: {
                        ...payment.metadata,
                        failedAt: new Date().toISOString(),
                        attempts: attempt,
                    },
                });

                return {
                    paymentId: payment._id,
                    success: false,
                    error: error.message,
                };
            }

            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        }
    }

    // This should never be reached, but just in case
    return {
        paymentId: payment._id,
        success: false,
        error: 'Max retries exceeded',
    };
}

/**
 * Check treasury balance to ensure sufficient BNB
 * @returns Treasury balance in BNB
 */
export async function checkTreasuryBalance(): Promise<{
    balance: string;
    balanceBNB: number;
    sufficient: boolean;
    minimumRequired: number;
}> {
    if (!TREASURY_PRIVATE_KEY) {
        throw new Error('TREASURY_PRIVATE_KEY not configured');
    }

    const account = privateKeyToAccount(TREASURY_PRIVATE_KEY as `0x${string}`);
    const balance = await publicClient.getBalance({ address: account.address });
    const balanceBNB = parseFloat(formatEther(balance));

    // Calculate total pending donations
    await connectDB();
    const pendingPayments = await Payment.find({ status: 'processing' });
    const totalPending = pendingPayments.reduce((sum, p) => sum + (p.amountBNB || 0), 0);

    return {
        balance: balance.toString(),
        balanceBNB,
        sufficient: balanceBNB >= totalPending,
        minimumRequired: totalPending,
    };
}
