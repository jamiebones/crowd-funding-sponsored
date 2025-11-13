/**
 * Utility functions for filtering active donations (excluding withdrawn donors)
 */

export interface Donation {
    id: string;
    donor: {
        id: string;
    };
    amount: string;
    timestamp: string;
    [key: string]: any;
}

export interface Withdrawal {
    id: string;
    donor: {
        id: string;
    } | string;
    amount: string;
    timestamp: string;
    [key: string]: any;
}

/**
 * Creates a Set of donor IDs who have withdrawn from a campaign
 * @param withdrawals - Array of withdrawal records
 * @returns Set of donor IDs who have withdrawn
 */
export function getWithdrawnDonorIds(withdrawals: Withdrawal[]): Set<string> {
    return new Set(
        withdrawals.map((w) =>
            typeof w.donor === 'string' ? w.donor : w.donor.id
        )
    );
}

/**
 * Filters donations to only include active donors (those who haven't withdrawn)
 * @param donations - Array of donation records
 * @param withdrawals - Array of withdrawal records
 * @returns Filtered array of donations from active donors only
 */
export function filterActiveDonations(
    donations: Donation[],
    withdrawals: Withdrawal[] = []
): Donation[] {
    if (!donations || donations.length === 0) {
        return [];
    }

    if (!withdrawals || withdrawals.length === 0) {
        return donations;
    }

    const withdrawnDonors = getWithdrawnDonorIds(withdrawals);

    return donations.filter(
        (donation) => !withdrawnDonors.has(donation.donor.id)
    );
}

/**
 * Gets the count of active donors (excluding those who have withdrawn)
 * @param donations - Array of donation records
 * @param withdrawals - Array of withdrawal records
 * @returns Number of active donors
 */
export function getActiveDonorsCount(
    donations: Donation[],
    withdrawals: Withdrawal[] = []
): number {
    return filterActiveDonations(donations, withdrawals).length;
}

/**
 * Checks if a specific donor has withdrawn from a campaign
 * @param donorId - The donor's wallet address
 * @param withdrawals - Array of withdrawal records
 * @returns true if the donor has withdrawn, false otherwise
 */
export function hasDonorWithdrawn(
    donorId: string,
    withdrawals: Withdrawal[] = []
): boolean {
    const withdrawnDonors = getWithdrawnDonorIds(withdrawals);
    return withdrawnDonors.has(donorId.toLowerCase());
}
