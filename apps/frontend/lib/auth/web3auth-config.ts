import { Web3Auth } from '@web3auth/modal';
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from '@web3auth/base';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';
import { bsc } from 'wagmi/chains';

const chainConfig = {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: `0x${bsc.id.toString(16)}`, // BSC Mainnet (56)
    rpcTarget: process.env.NEXT_PUBLIC_BSC_MAINNET_RPC || 'https://bsc-dataseed2.bnbchain.org',
    displayName: bsc.name,
    blockExplorerUrl: bsc.blockExplorers.default.url,
    ticker: bsc.nativeCurrency.symbol,
    tickerName: bsc.nativeCurrency.name,
    logo: 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
};

let web3auth: Web3Auth | null = null;

export const initWeb3Auth = async (): Promise<Web3Auth> => {
    if (web3auth) {
        return web3auth;
    }

    const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || '';

    if (!clientId) {
        throw new Error(
            'Web3Auth Client ID is not configured. Please set NEXT_PUBLIC_WEB3AUTH_CLIENT_ID in your environment variables.'
        );
    }

    web3auth = new Web3Auth({
        clientId,
        web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
        uiConfig: {
            appName: 'CrowdFunding Platform',
            theme: {
                primary: '#3b82f6',
            },
            mode: 'dark',
            logoLight: 'https://web3auth.io/images/web3authlog.png',
            logoDark: 'https://web3auth.io/images/web3authlogodark.png',
            defaultLanguage: 'en',
            loginGridCol: 3,
            primaryButton: 'socialLogin',
        },
    });

    await web3auth.init();

    return web3auth;
};

export const getWeb3Auth = (): Web3Auth | null => {
    return web3auth;
};

export const resetWeb3Auth = () => {
    web3auth = null;
};
