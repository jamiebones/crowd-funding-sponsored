export const CONTRACTS = {
    FACTORY: process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`,
    TOKEN: process.env.NEXT_PUBLIC_TOKEN_ADDRESS as `0x${string}`,
    IMPLEMENTATION: process.env.NEXT_PUBLIC_IMPLEMENTATION_ADDRESS as `0x${string}`,
} as const;

export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 97;

export const BLOCK_EXPLORER = process.env.NEXT_PUBLIC_BLOCK_EXPLORER || 'https://testnet.bscscan.com';

export const ARWEAVE_GATEWAY = process.env.NEXT_PUBLIC_ARWEAVE_GATEWAY || 'https://arweave.net';

export const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL;

export const FUNDING_FEE = '0.000000001'; // ETH

export const CATEGORIES = [
    { id: 0, name: 'Technology', icon: '💻' },
    { id: 1, name: 'Arts', icon: '🎨' },
    { id: 2, name: 'Community', icon: '🤝' },
    { id: 3, name: 'Education', icon: '📚' },
    { id: 4, name: 'Environment', icon: '🌱' },
    { id: 5, name: 'Health', icon: '❤️' },
    { id: 6, name: 'Social', icon: '👥' },
    { id: 7, name: 'Charity', icon: '🎁' },
    { id: 8, name: 'Other', icon: '📦' },
] as const;

export const MILESTONE_STATUS = {
    DEFAULT: 0,
    PENDING: 1,
    APPROVED: 2,
    DECLINED: 3,
} as const;

export const WITHDRAWAL_TAX_RATE = 10; // 10%

export const VOTING_PERIOD_DAYS = 14;

export const MAX_MILESTONES = 3;
