import { createPublicClient, http, Address } from 'viem';
import { bscTestnet } from 'viem/chains';
import CROWD_FUNDING_ABI from '@/abis/CrowdFunding.json';

const publicClient = createPublicClient({
    chain: bscTestnet,
    transport: http(),
});

/**
 * Verify if an address is the owner of a campaign contract
 * @param campaignAddress - The campaign contract address
 * @param userAddress - The user's wallet address to verify
 * @returns Promise<boolean> - True if user is the owner
 */
export async function verifyCampaignOwner(
    campaignAddress: string,
    userAddress: string
): Promise<boolean> {
    try {
        // Read campaignOwner from the contract
        const owner = await publicClient.readContract({
            address: campaignAddress as Address,
            abi: CROWD_FUNDING_ABI.abi,
            functionName: 'getCampaignOwner',
        }) as Address;

        // Compare addresses (case-insensitive)
        return owner.toLowerCase() === userAddress.toLowerCase();
    } catch (error) {
        console.error('Error verifying campaign owner:', error);
        return false;
    }
}

/**
 * Get the owner address of a campaign
 * @param campaignAddress - The campaign contract address
 * @returns Promise<string | null> - Owner address or null if error
 */
export async function getCampaignOwner(
    campaignAddress: string
): Promise<string | null> {
    try {
        const owner = await publicClient.readContract({
            address: campaignAddress as Address,
            abi: CROWD_FUNDING_ABI.abi,
            functionName: 'getCampaignOwner',
        }) as Address;

        return owner;
    } catch (error) {
        console.error('Error getting campaign owner:', error);
        return null;
    }
}
