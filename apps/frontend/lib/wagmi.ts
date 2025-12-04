import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
    metaMaskWallet,
    walletConnectWallet,
    coinbaseWallet,
    trustWallet,
    injectedWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { bscTestnet, bsc} from 'wagmi/chains';
import { http, createConfig } from 'wagmi';
import { createStorage } from 'wagmi';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

if (!projectId) {
    console.warn('WalletConnect Project ID is not set. Get one at https://cloud.walletconnect.com');
}

// Define connectors with unique wallets
const connectors = connectorsForWallets(
    [
        {
            groupName: 'Recommended',
            wallets: [
                metaMaskWallet,
                walletConnectWallet,
                coinbaseWallet,
                trustWallet,
                injectedWallet,
            ],
        },
    ],
    {
        appName: 'CrowdFunding Platform',
        projectId,
    }
);

export const config = createConfig({
    connectors,
    chains: [bsc],
    transports: {
        [bsc.id]: http(process.env.NEXT_PUBLIC_BSC_MAINNET_RPC),
    },
    ssr: true,
    storage: createStorage({
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    }),
});
