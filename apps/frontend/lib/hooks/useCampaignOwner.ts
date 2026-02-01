import { useReadContract } from 'wagmi';
import CROWD_FUNDING_ABI from '@/abis/CrowdFunding.json';

interface UseCampaignOwnerParams {
    campaignAddress?: string;
    userAddress?: string;
}

/**
 * Hook to verify if the connected user is the owner of a campaign
 * @param campaignAddress - The campaign contract address
 * @param userAddress - The user's wallet address
 * @returns Object with isOwner status and loading state
 */
export function useCampaignOwner({ campaignAddress, userAddress }: UseCampaignOwnerParams) {
    const { data: contractOwner, isLoading, isError } = useReadContract({
        address: campaignAddress as `0x${string}`,
        abi: CROWD_FUNDING_ABI.abi,
        functionName: 'getCampaignOwner',
        query: {
            enabled: !!campaignAddress && !!userAddress,
        },
    });

    const isOwner = contractOwner && userAddress
        ? (contractOwner as string).toLowerCase() === userAddress.toLowerCase()
        : false;

    return {
        isOwner,
        contractOwner: contractOwner as string | undefined,
        isLoading,
        isError,
    };
}
