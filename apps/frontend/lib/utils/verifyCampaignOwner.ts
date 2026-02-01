import { print } from 'graphql';
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
 * Server-side GraphQL query function
 * Directly fetches from subgraph with bearer token authentication
 * This is needed because Apollo Client with relative URLs doesn't work in API routes
 */
async function serverSideGraphQLQuery<T>(
    query: ReturnType<typeof import('graphql').parse>,
    variables: Record<string, unknown>
): Promise<T> {
    const subgraphUrl = process.env.NEXT_PUBLIC_SUBGRAPH_URL;
    const bearerToken = process.env.BEARER_TOKEN;

    if (!subgraphUrl) {
        throw new Error('NEXT_PUBLIC_SUBGRAPH_URL is not configured');
    }

    const response = await fetch(subgraphUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(bearerToken ? { 'Authorization': `Bearer ${bearerToken}` } : {}),
        },
        body: JSON.stringify({
            query: print(query),
            variables,
        }),
    });

    if (!response.ok) {
        throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    if (result.errors && result.errors.length > 0) {
        throw new Error(`GraphQL errors: ${result.errors.map((e: { message: string }) => e.message).join(', ')}`);
    }

    return result.data as T;
}

/**
 * Verify if an address is the owner of a campaign contract
 * Uses subgraph to get owner information via direct fetch (server-side)
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

        const data = await serverSideGraphQLQuery<CampaignOwnerData>(
            GET_CAMPAIGN_OWNER,
            { id: campaignAddress.toLowerCase() }
        );

        if (!data?.campaign) {
            console.error('[verifyCampaignOwner] Campaign not found in subgraph');
            return false;
        }

        const owner = data.campaign.owner.id;

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
 * Uses direct fetch to query the subgraph (server-side)
 * @param campaignAddress - The campaign contract address
 * @returns Promise<string | null> - Owner address or null if error
 */
export async function getCampaignOwner(
    campaignAddress: string
): Promise<string | null> {
    try {
        const data = await serverSideGraphQLQuery<CampaignOwnerData>(
            GET_CAMPAIGN_OWNER,
            { id: campaignAddress.toLowerCase() }
        );

        if (!data?.campaign) {
            return null;
        }

        return data.campaign.owner.id;
    } catch (error) {
        console.error('Error getting campaign owner:', error);
        return null;
    }
}
