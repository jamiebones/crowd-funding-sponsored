import { createPublicClient, http, Address } from 'viem';
import { bscTestnet } from 'viem/chains';
import CROWD_FUNDING_ABI from '@/abis/CrowdFunding.json';

const publicClient = createPublicClient({
    chain: bscTestnet,
    transport: http(),
});

/**
 * Verify if an address is the owner of a campaign contract
 * Uses subgraph to get owner information instead of direct contract calls
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

        // Query the subgraph for campaign owner
        const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL || 'https://api.studio.thegraph.com/query/90963/crowd-funding/version/latest';

        const query = `
            query GetCampaignOwner($id: ID!) {
                campaign(id: $id) {
                    id
                    owner {
                        id
                    }
                }
            }
        `;

        const response = await fetch(SUBGRAPH_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query,
                variables: {
                    id: campaignAddress.toLowerCase(),
                },
            }),
        });

        const result = await response.json();

        if (result.errors) {
            console.error('[verifyCampaignOwner] GraphQL errors:', result.errors);
            return false;
        }

        if (!result.data?.campaign) {
            console.error('[verifyCampaignOwner] Campaign not found in subgraph');
            return false;
        }

        const owner = result.data.campaign.owner.id;

        console.log('[verifyCampaignOwner] Subgraph owner:', owner);
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
 * Uses subgraph to get owner information
 * @param campaignAddress - The campaign contract address
 * @returns Promise<string | null> - Owner address or null if error
 */
export async function getCampaignOwner(
    campaignAddress: string
): Promise<string | null> {
    try {
        const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL || 'https://api.studio.thegraph.com/query/90963/crowd-funding/version/latest';

        const query = `
            query GetCampaignOwner($id: ID!) {
                campaign(id: $id) {
                    owner {
                        id
                    }
                }
            }
        `;

        const response = await fetch(SUBGRAPH_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query,
                variables: {
                    id: campaignAddress.toLowerCase(),
                },
            }),
        });

        const result = await response.json();

        if (result.errors || !result.data?.campaign) {
            return null;
        }

        return result.data.campaign.owner.id;
    } catch (error) {
        console.error('Error getting campaign owner:', error);
        return null;
    }
}
