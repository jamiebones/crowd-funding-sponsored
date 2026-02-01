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
        console.log('[verifyCampaignOwner] Input:', {
            campaignAddress,
            userAddress,
        });

        // Read campaign details from the contract
        // getFundingDetails returns (owner, duration, targetAmount)
        const result = await publicClient.readContract({
            address: campaignAddress as Address,
            abi: CROWD_FUNDING_ABI.abi,
            functionName: 'getFundingDetails',
        }) as [Address, bigint, bigint];

        const owner = result[0];
        
        console.log('[verifyCampaignOwner] Contract owner:', owner);
        console.log('[verifyCampaignOwner] User address:', userAddress);
        console.log('[verifyCampaignOwner] Comparison:', {
            ownerLower: owner.toLowerCase(),
            userLower: userAddress.toLowerCase(),
            match: owner.toLowerCase() === userAddress.toLowerCase()
        });

        // Compare addresses (case-insensitive)
        return owner.toLowerCase() === userAddress.toLowerCase();
    } catch (error) {
        console.error('[verifyCampaignOwner] Error:', error);
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
        // getFundingDetails returns (owner, duration, targetAmount)
        const result = await publicClient.readContract({
            address: campaignAddress as Address,
            abi: CROWD_FUNDING_ABI.abi,
            functionName: 'getFundingDetails',
        }) as [Address, bigint, bigint];

        return result[0];
    } catch (error) {
        console.error('Error getting campaign owner:', error);
        return null;
    }
}
