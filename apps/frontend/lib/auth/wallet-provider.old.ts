import { ethers } from 'ethers';
import { getWeb3Auth } from './web3auth-config';

export type WalletMode = 'web3' | 'social';

const WALLET_MODE_KEY = 'crowdfunding_wallet_mode';

/**
 * Get the current wallet mode from local storage
 * @returns The current wallet mode ('web3' or 'social')
 */
export const getWalletMode = (): WalletMode => {
    if (typeof window === 'undefined') return 'web3';

    const stored = localStorage.getItem(WALLET_MODE_KEY);
    if (stored && (stored === 'web3' || stored === 'social')) {
        return stored as WalletMode;
    }

    return 'web3';
};

/**
 * Set the wallet mode in local storage
 * @param mode - The wallet mode to set
 */
export const setWalletMode = (mode: WalletMode): void => {
    if (mode !== 'web3' && mode !== 'social') {
        throw new Error(`Invalid wallet mode: ${mode}. Expected 'web3' or 'social'`);
    }

    if (typeof window !== 'undefined') {
        localStorage.setItem(WALLET_MODE_KEY, mode);
    }
};

/**
 * Clear wallet mode from local storage
 */
export const clearWalletMode = (): void => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(WALLET_MODE_KEY);
    }
};

/**
 * Get the wallet address based on current wallet mode
 * Used by authContext to retrieve address for both Web3Auth and traditional wallets
 * @returns The wallet address or null if not connected
 */
export const getWalletAddress = async (): Promise<string | null> => {
    try {
        const mode = getWalletMode();

        if (mode === 'social') {
            const web3auth = getWeb3Auth();
            if (!web3auth || !web3auth.provider) {
                return null;
            }
            const provider = new ethers.BrowserProvider(web3auth.provider);
            const signer = await provider.getSigner();
            return signer.address;
        }

        // For 'web3' mode, get address from window.ethereum
        // Note: In production, wagmi's useAccount hook should be used instead
        if (typeof window === 'undefined' || !window.ethereum) {
            return null;
        }
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        return signer.address;
    } catch (error) {
        console.error('Error getting wallet address:', error);
        return null;
    }
};
