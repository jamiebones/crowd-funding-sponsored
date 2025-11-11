import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { bscTestnet } from 'wagmi/chains';
import { http } from 'wagmi';
import { createStorage } from 'wagmi';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

if (!projectId) {
    console.warn('WalletConnect Project ID is not set. Get one at https://cloud.walletconnect.com');
}

export const config = getDefaultConfig({
    appName: 'CrowdFunding Platform',
    projectId,
    chains: [bscTestnet],
    transports: {
        [bscTestnet.id]: http(process.env.NEXT_PUBLIC_BSC_TESTNET_RPC),
    },
    ssr: true,
    storage: createStorage({
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    }),
});
