import { apolloClient } from '@/lib/apollo';
import { GET_CAMPAIGN_OWNER } from '@/lib/queries/campaign-owner';

interface CampaignOwnerData {
    campaign: {
        id: string;
        owner: {
            id: string;
        };
    } | null;
}

/**
 * Verify if an address is the owner of a campaign contract
 * Uses subgraph to get owner information through Apollo Client
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

        const result = await apolloClient.query<CampaignOwnerData>({
            query: GET_CAMPAIGN_OWNER,
            variables: {
                id: campaignAddress.toLowerCase(),
            },
            fetchPolicy: 'network-only',
        });

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
        if (error && typeof error === 'object' && 'graphQLErrors' in error) {
            const gqlError = error as { graphQLErrors?: Array<unknown> };
            console.error('[verifyCampaignOwner] GraphQL errors:', gqlError.graphQLErrors);
        }
        console.error('[verifyCampaignOwner] Error:', error);
        return false;
    }
}

/**
 * Get the owner address of a campaign
 * Uses Apollo Client to query the subgraph
 * @param campaignAddress - The campaign contract address
 * @returns Promise<string | null> - Owner address or null if error
 */
export async function getCampaignOwner(
    campaignAddress: string
): Promise<string | null> {
    try {
        const result = await apolloClient.query<CampaignOwnerData>({
            query: GET_CAMPAIGN_OWNER,
            variables: {
                id: campaignAddress.toLowerCase(),
            },
            fetchPolicy: 'network-only',
        });

        if (!result.data?.campaign) {
            return null;
        }

        return result.data.campaign.owner.id;
    } catch (error) {
        console.error('Error getting campaign owner:', error);
        return null;
    }
}
