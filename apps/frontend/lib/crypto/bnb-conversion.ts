/**
 * BNB Conversion Service - Platform Liquidity Pool Approach
 * 
 * PRODUCTION STRATEGY:
 * Platform maintains BNB treasury and instantly converts USD payments to BNB donations:
 * 1. User pays USD via Stripe
 * 2. Platform calculates net BNB after fees and gas
 * 3. Platform transfers BNB from treasury to execute donation
 * 4. Platform periodically replenishes treasury with aggregated USD
 * 
 * Benefits:
 * - Instant donations (no 5-15 min on-ramp wait)
 * - No 3rd party dependencies (MoonPay, Transak)
 * - Seamless UX (user doesn't see crypto steps)
 * - Lower fees (bulk BNB purchases by platform)
 */

export interface BNBConversionParams {
    amountUSD: number;
    campaignAddress: string;
}

export interface BNBConversionResult {
    success: boolean;
    amountBNB: number;
    bnbPrice: number;
    platformFee: number;
    netBNB: number; // After deducting gas
    estimatedGas: number;
    error?: string;
}

// Platform configuration
const PLATFORM_FEE_PERCENTAGE = 0.03; // 3% platform fee
const GAS_BUFFER_MULTIPLIER = 1.2; // 20% buffer for gas estimation

/**
 * Calculate BNB conversion from USD payment
 * Determines net BNB to donate after fees and gas
 * 
 * @param params - USD amount and campaign address
 * @returns Conversion details including fees and net BNB
 */
export async function calculateBNBConversion(
    params: BNBConversionParams
): Promise<BNBConversionResult> {
    try {
        const { amountUSD, campaignAddress } = params;

        // Get current BNB price
        const bnbPrice = await getBNBPrice();

        // Calculate gross BNB amount
        const grossBNB = amountUSD / bnbPrice;

        // Deduct platform fee (3%)
        const platformFee = grossBNB * PLATFORM_FEE_PERCENTAGE;
        const bnbAfterFee = grossBNB - platformFee;

        // Estimate gas cost for donation transaction
        const estimatedGas = await estimateGasCost(campaignAddress);

        // Calculate net BNB (after gas)
        const netBNB = bnbAfterFee - estimatedGas;

        if (netBNB <= 0) {
            throw new Error('Amount too small after fees and gas');
        }

        return {
            success: true,
            amountBNB: grossBNB,
            bnbPrice,
            platformFee,
            netBNB,
            estimatedGas,
        };
    } catch (error: any) {
        console.error('BNB conversion calculation failed:', error);
        return {
            success: false,
            amountBNB: 0,
            bnbPrice: 0,
            platformFee: 0,
            netBNB: 0,
            estimatedGas: 0,
            error: error.message || 'Conversion calculation failed',
        };
    }
}

/**
 * Get real-time BNB price from CoinGecko API
 * @returns BNB price in USD
 */
export async function getBNBPrice(): Promise<number> {
    try {
        const response = await fetch(
            'https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd',
            {
                next: { revalidate: 60 }, // Cache for 60 seconds
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch BNB price');
        }

        const data = await response.json();
        const price = data.binancecoin.usd;

        console.log('Current BNB price:', price, 'USD');
        return price;
    } catch (error) {
        console.error('Failed to fetch BNB price:', error);
        // Fallback price (conservative estimate)
        return 650;
    }
}

/**
 * Estimate gas cost for a donation transaction
 * This is the BNB needed to execute the campaign.giveDonationToCause() call
 * 
 * @param campaignAddress - Campaign contract address
 * @returns Estimated gas cost in BNB
 */
async function estimateGasCost(campaignAddress: string): Promise<number> {
    try {
        // Typical gas for giveDonationToCause transaction
        // Estimate: ~150,000 gas units (with token minting)
        const estimatedGasUnits = 150000;

        // BSC gas price (typically 3-5 Gwei on mainnet)
        // For safety, use higher estimate
        const gasPriceGwei = 5; // 5 Gwei
        const gasPriceWei = gasPriceGwei * 1e9;

        // Calculate total gas cost in BNB
        const gasCostWei = estimatedGasUnits * gasPriceWei;
        const gasCostBNB = gasCostWei / 1e18;

        // Add buffer for gas price spikes
        const bufferedGasCost = gasCostBNB * GAS_BUFFER_MULTIPLIER;

        console.log('Estimated gas cost:', bufferedGasCost, 'BNB');
        return bufferedGasCost;
    } catch (error) {
        console.error('Failed to estimate gas cost:', error);
        // Conservative fallback: 0.002 BNB (~$1.30 at $650/BNB)
        return 0.002;
    }
}

/**
 * Validate minimum donation amount
 * Ensures donation is large enough to cover gas and platform fees
 * 
 * @param amountUSD - Donation amount in USD
 * @returns Whether amount meets minimum threshold
 */
export async function validateMinimumDonation(amountUSD: number): Promise<{
    valid: boolean;
    minimumUSD?: number;
    reason?: string;
}> {
    try {
        const conversion = await calculateBNBConversion({
            amountUSD,
            campaignAddress: '0x0000000000000000000000000000000000000000', // Dummy address for estimation
        });

        if (!conversion.success) {
            return {
                valid: false,
                reason: conversion.error,
            };
        }

        if (conversion.netBNB <= 0) {
            // Calculate minimum viable donation
            const bnbPrice = conversion.bnbPrice;
            const minBNBNeeded = conversion.estimatedGas / (1 - PLATFORM_FEE_PERCENTAGE) + 0.001; // Small donation minimum
            const minimumUSD = Math.ceil(minBNBNeeded * bnbPrice);

            return {
                valid: false,
                minimumUSD,
                reason: `Minimum donation is $${minimumUSD} to cover fees and gas`,
            };
        }

        return { valid: true };
    } catch (error: any) {
        return {
            valid: false,
            reason: error.message || 'Validation failed',
        };
    }
}
