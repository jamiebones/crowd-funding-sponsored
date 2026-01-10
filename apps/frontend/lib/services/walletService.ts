import { createPublicClient, createWalletClient, http, parseEther, formatEther } from 'viem';
import { bsc } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { decryptPrivateKeyFromString } from './encryptionService';

const BSC_RPC_URL = process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org';

/**
 * Creates a viem wallet client from an encrypted private key
 */
export function createWalletFromEncryptedKey(encryptedKey: string, salt: string) {
    const privateKey = decryptPrivateKeyFromString(encryptedKey, salt);
    const account = privateKeyToAccount(privateKey as `0x${string}`);

    const walletClient = createWalletClient({
        account,
        chain: bsc,
        transport: http(BSC_RPC_URL)
    });

    return { walletClient, account };
}

/**
 * Creates a public client for reading blockchain data
 */
export function createPublicBscClient() {
    return createPublicClient({
        chain: bsc,
        transport: http(BSC_RPC_URL)
    });
}

/**
 * Gets the BNB balance for an address
 */
export async function getWalletBalance(address: string): Promise<string> {
    const publicClient = createPublicBscClient();
    const balance = await publicClient.getBalance({
        address: address as `0x${string}`
    });
    return formatEther(balance);
}

/**
 * Gets multiple wallet balances in parallel
 */
export async function getMultipleWalletBalances(addresses: string[]): Promise<Map<string, string>> {
    const publicClient = createPublicBscClient();

    const balancePromises = addresses.map(async (address) => {
        const balance = await publicClient.getBalance({
            address: address as `0x${string}`
        });
        return { address, balance: formatEther(balance) };
    });

    const results = await Promise.all(balancePromises);

    const balanceMap = new Map<string, string>();
    results.forEach(({ address, balance }) => {
        balanceMap.set(address.toLowerCase(), balance);
    });

    return balanceMap;
}

/**
 * Estimates gas for a transaction
 */
export async function estimateGas(params: {
    account: `0x${string}`;
    to: `0x${string}`;
    data: `0x${string}`;
    value?: bigint;
}): Promise<bigint> {
    const publicClient = createPublicBscClient();
    return await publicClient.estimateGas(params);
}

/**
 * Gets current gas price
 */
export async function getGasPrice(): Promise<bigint> {
    const publicClient = createPublicBscClient();
    return await publicClient.getGasPrice();
}

/**
 * Gets the next nonce for an address
 */
export async function getTransactionCount(address: string): Promise<number> {
    const publicClient = createPublicBscClient();
    return await publicClient.getTransactionCount({
        address: address as `0x${string}`
    });
}

/**
 * Waits for a transaction receipt with timeout
 */
export async function waitForTransaction(
    txHash: `0x${string}`,
    timeout: number = 60000 // 60 seconds default
): Promise<any> {
    const publicClient = createPublicBscClient();

    return await publicClient.waitForTransactionReceipt({
        hash: txHash,
        timeout
    });
}

/**
 * Checks if an address has sufficient balance for a transaction
 */
export async function hasSufficientBalance(
    address: string,
    requiredAmount: string // in BNB
): Promise<boolean> {
    const balance = await getWalletBalance(address);
    return parseFloat(balance) >= parseFloat(requiredAmount);
}
