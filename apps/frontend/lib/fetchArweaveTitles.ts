/**
 * Fetches campaign titles from Arweave for items that don't have titles in the subgraph.
 * This is useful because CampaignContent is immutable and derived, so it might not always be indexed immediately.
 * 
 * @param items - Array of items (campaigns, donations, etc.) that have a campaignCID field
 * @param getCampaignCID - Function to extract campaignCID from an item
 * @param hasTitle - Function to check if an item already has a title
 * @returns Promise<Array> - Items with fetched titles added as `fetchedTitle` property
 */
export async function fetchArweaveTitles<T extends Record<string, any>>(
    items: T[],
    getCampaignCID: (item: T) => string | undefined,
    hasTitle: (item: T) => boolean
): Promise<Array<T & { fetchedTitle?: string }>> {
    if (items.length === 0) return [];

    const results = await Promise.all(
        items.map(async (item): Promise<T & { fetchedTitle?: string }> => {
            // If title already exists in subgraph, use it
            if (hasTitle(item)) {
                return item;
            }

            // Otherwise, fetch from Arweave using campaignCID
            const campaignCID = getCampaignCID(item);
            if (campaignCID) {
                try {
                    const response = await fetch(`https://arweave.net/${campaignCID}`);
                    const content = await response.json();
                    return {
                        ...item,
                        fetchedTitle: content.title
                    };
                } catch (err) {
                    console.error('Failed to fetch title from Arweave for CID:', campaignCID, err);
                    return item;
                }
            }

            return item;
        })
    );

    return results;
}

/**
 * Gets the display title from an item, checking multiple sources in priority order:
 * 1. content.title (from subgraph)
 * 2. fetchedTitle (from Arweave)
 * 3. title (fallback)
 * 4. 'Untitled Campaign' (default)
 * 
 * @param item - The item to get the title from
 * @returns string - The display title
 */
export function getDisplayTitle(item: any): string {
    return item?.content?.title || item?.fetchedTitle || item?.title || 'Untitled Campaign';
}
