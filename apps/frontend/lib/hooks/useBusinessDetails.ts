import { useState, useEffect, useCallback } from 'react';
import { CampaignBusinessDetailsInput, CampaignBusinessDetailsResponse } from '@/types/business-details';

interface UseBusinessDetailsOptions {
    campaignAddress?: string;
    ownerAddress?: string;
    autoFetch?: boolean;
}

interface UseBusinessDetailsReturn {
    businessDetails: CampaignBusinessDetailsResponse | null;
    businessDetailsList: CampaignBusinessDetailsResponse[];
    loading: boolean;
    error: string | null;
    fetchBusinessDetails: () => Promise<void>;
    createBusinessDetails: (data: CampaignBusinessDetailsInput) => Promise<CampaignBusinessDetailsResponse>;
    updateBusinessDetails: (data: Partial<CampaignBusinessDetailsInput> & { campaignAddress: string }) => Promise<CampaignBusinessDetailsResponse>;
    deleteBusinessDetails: (campaignAddress: string) => Promise<void>;
}

/**
 * Custom hook for managing campaign business details
 */
export function useBusinessDetails({
    campaignAddress,
    ownerAddress,
    autoFetch = true,
}: UseBusinessDetailsOptions = {}): UseBusinessDetailsReturn {
    const [businessDetails, setBusinessDetails] = useState<CampaignBusinessDetailsResponse | null>(null);
    const [businessDetailsList, setBusinessDetailsList] = useState<CampaignBusinessDetailsResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchBusinessDetails = useCallback(async () => {
        if (!campaignAddress && !ownerAddress) {
            setError('Either campaignAddress or ownerAddress is required');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            if (campaignAddress) params.append('campaignAddress', campaignAddress);
            if (ownerAddress) params.append('ownerAddress', ownerAddress);

            const response = await fetch(`/api/campaign-business-details?${params.toString()}`);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to fetch business details');
            }

            // If fetching by campaign address, set single result
            if (campaignAddress) {
                setBusinessDetails(result.data);
            }
            // If fetching by owner address, set list
            else if (ownerAddress) {
                setBusinessDetailsList(result.data);
            }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
            console.error('Error fetching business details:', err);
        } finally {
            setLoading(false);
        }
    }, [campaignAddress, ownerAddress]);

    const createBusinessDetails = useCallback(async (
        data: CampaignBusinessDetailsInput
    ): Promise<CampaignBusinessDetailsResponse> => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/campaign-business-details', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create business details');
            }

            setBusinessDetails(result.data);
            return result.data;

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateBusinessDetails = useCallback(async (
        data: Partial<CampaignBusinessDetailsInput> & { campaignAddress: string }
    ): Promise<CampaignBusinessDetailsResponse> => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/campaign-business-details', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to update business details');
            }

            setBusinessDetails(result.data);
            return result.data;

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteBusinessDetails = useCallback(async (campaignAddress: string): Promise<void> => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `/api/campaign-business-details?campaignAddress=${campaignAddress}`,
                {
                    method: 'DELETE',
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to delete business details');
            }

            setBusinessDetails(null);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Auto-fetch on mount if enabled
    useEffect(() => {
        if (autoFetch && (campaignAddress || ownerAddress)) {
            fetchBusinessDetails();
        }
    }, [autoFetch, campaignAddress, ownerAddress, fetchBusinessDetails]);

    return {
        businessDetails,
        businessDetailsList,
        loading,
        error,
        fetchBusinessDetails,
        createBusinessDetails,
        updateBusinessDetails,
        deleteBusinessDetails,
    };
}
