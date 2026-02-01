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
    // getFundingDetails returns [owner, duration, targetAmount]
    const { data: fundingDetails, isLoading, isError } = useReadContract({
        address: campaignAddress as `0x${string}`,
        abi: CROWD_FUNDING_ABI.abi,
        functionName: 'getFundingDetails',
        query: {
            enabled: !!campaignAddress && !!userAddress,
        },
    });

    const contractOwner = fundingDetails ? (fundingDetails as [string, bigint, bigint])[0] : undefined;

    const isOwner = contractOwner && userAddress
        ? contractOwner.toLowerCase() === userAddress.toLowerCase()
        : false;

    return {
        isOwner,
        contractOwner,
        isLoading,
        isError,
    };
}