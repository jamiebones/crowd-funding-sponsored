export const CONTRACTS = {
    FACTORY: process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`,
    TOKEN: process.env.NEXT_PUBLIC_TOKEN_ADDRESS as `0x${string}`,
    IMPLEMENTATION: process.env.NEXT_PUBLIC_IMPLEMENTATION_ADDRESS as `0x${string}`,
} as const;

// Contract addresses for individual usage
export const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`;
export const TOKEN_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_ADDRESS as `0x${string}`;
export const IMPLEMENTATION_ADDRESS = process.env.NEXT_PUBLIC_IMPLEMENTATION_ADDRESS as `0x${string}`;

export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 97;

export const BLOCK_EXPLORER = process.env.NEXT_PUBLIC_BLOCK_EXPLORER || 'https://testnet.bscscan.com';

export const ARWEAVE_GATEWAY = process.env.NEXT_PUBLIC_ARWEAVE_GATEWAY || 'https://arweave.net';

export const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL;

/**
 * @deprecated Use getFundingFee() contract call instead. Fee can be changed by factory owner.
 */
export const FUNDING_FEE = '0.000000001'; // BNB

/**
 * @deprecated Use getFundingFee() contract call instead. Fee can be changed by factory owner.
 */
export const PLATFORM_FEE = '0.000000001'; // BNB (alias for FUNDING_FEE)

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

export const CATEGORY_LABELS: { [key: number]: string } = {
    0: 'Technology',
    1: 'Arts',
    2: 'Community',
    3: 'Education',
    4: 'Environment',
    5: 'Health',
    6: 'Social',
    7: 'Charity',
    8: 'Other',
};

// Category mapping from URL to enum
export const CATEGORY_MAP: { [key: string]: number } = {
    technology: 0,
    arts: 1,
    community: 2,
    education: 3,
    environment: 4,
    health: 5,
    social: 6,
    charity: 7,
    other: 8,
};

// Category descriptions
export const CATEGORY_DESCRIPTIONS: { [key: string]: string } = {
    technology: 'Software, hardware, and tech innovations driving the future',
    arts: 'Creative projects, music, film, and artistic endeavors',
    community: 'Local initiatives and community-driven projects',
    education: 'Learning resources, courses, and educational programs',
    environment: 'Sustainability, conservation, and eco-friendly projects',
    health: 'Medical research, healthcare, and wellness initiatives',
    social: 'Social causes and humanitarian efforts',
    charity: 'Charitable organizations and relief efforts',
    other: 'Innovative projects that don\'t fit traditional categories',
};

export const MILESTONE_STATUS = {
    DEFAULT: 0,
    PENDING: 1,
    APPROVED: 2,
    DECLINED: 3,
} as const;

export const WITHDRAWAL_TAX_RATE = 10; // 10%

export const VOTING_PERIOD_DAYS = 14;

export const MAX_MILESTONES = 3;
