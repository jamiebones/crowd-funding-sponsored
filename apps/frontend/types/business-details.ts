/**
 * Type definitions for Campaign Business Details
 */

export interface CampaignBusinessDetailsInput {
    campaignAddress: string;
    ownerAddress: string;

    // Team & Leadership
    who1: string;
    who2?: string;
    who3?: string;

    // Core Information
    quantity?: string;
    introVideo?: string;
    wishDreamPrayer?: string;
    urgent: boolean;
    rank?: number;
    ownership?: number;

    // Product/Service Details
    what1: string;
    what2?: string;
    what3?: string;
    what4?: string;

    // Value Proposition
    why1: string;
    why2?: string;
    why3?: string;

    // Strategy & Execution
    how: string;
    where: string;
    when: string;

    // Development Stages
    concept: string;
    mvp?: string;
    launchV1?: string;
    currentVersion?: string;

    // Market Analysis
    tamBillions?: number;
    targetReach2028Billions?: number;
    strategies: string;

    // Customer Metrics
    reachedEst?: number;
    subsEst?: number;
    convertedEst?: number;
    upsoldEst?: number;
    advocatesEst?: number;
    partnersEst?: number;

    // Economics
    cpaEst?: number;
    targetCPA?: number;
    aspEst?: number;
    targetASP?: number;
    cltv?: number;

    // Entrepreneur Segments
    entrepreneursTier4?: number;
    entrepreneursTier4Target?: string;
    entrepreneursTier3?: number;
    entrepreneursTier3Target?: string;
    entrepreneursTier2?: number;
    entrepreneursTier2Target?: string;
    entrepreneursTier1?: number;
    entrepreneursTier1Target?: string;

    // Revenue & Financial Metrics
    revenueImpactedBillions?: number;
    highlights?: string;
    revenueMillions?: number;
    netProfitPercent?: number;

    // Revenue Projections
    revenue2026Millions?: number;
    revenue2027Millions?: number;
    revenue2028Millions?: number;

    // Profitability Metrics
    netProfitPercentProjection?: number;
    grossProfitPercent?: number;
    fcfEst?: number;

    // Valuation
    valuePerEntrepreneurThousands?: number;
    value2024MillionsEst?: number;
    value2025MillionsEst?: number;
    value2026MillionsEst?: number;
    value2027MillionsEst?: number;
    value2028BillionsEst?: number;

    // Financing
    nettDebtThousands?: number;
    ask2026?: number;
    offer2026?: string;
}

export interface CampaignBusinessDetailsResponse extends CampaignBusinessDetailsInput {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Form section groupings for multi-step form
 */
export const BUSINESS_DETAILS_SECTIONS = {
    TEAM: {
        title: 'Team & Leadership',
        fields: ['who1', 'who2', 'who3', 'ownership'],
    },
    OVERVIEW: {
        title: 'Overview',
        fields: ['quantity', 'introVideo', 'wishDreamPrayer', 'urgent', 'rank'],
    },
    PRODUCT: {
        title: 'Product/Service (What)',
        fields: ['what1', 'what2', 'what3', 'what4'],
    },
    VALUE_PROPOSITION: {
        title: 'Value Proposition (Why)',
        fields: ['why1', 'why2', 'why3'],
    },
    STRATEGY: {
        title: 'Strategy & Execution',
        fields: ['how', 'where', 'when', 'strategies'],
    },
    DEVELOPMENT: {
        title: 'Development Stages',
        fields: ['concept', 'mvp', 'launchV1', 'currentVersion'],
    },
    MARKET: {
        title: 'Market Analysis',
        fields: ['tamBillions', 'targetReach2028Billions'],
    },
    CUSTOMERS: {
        title: 'Customer Metrics',
        fields: ['reachedEst', 'subsEst', 'convertedEst', 'upsoldEst', 'advocatesEst', 'partnersEst'],
    },
    ECONOMICS: {
        title: 'Unit Economics',
        fields: ['cpaEst', 'targetCPA', 'aspEst', 'targetASP', 'cltv'],
    },
    SEGMENTS: {
        title: 'Entrepreneur Segments',
        fields: [
            'entrepreneursTier4', 'entrepreneursTier4Target',
            'entrepreneursTier3', 'entrepreneursTier3Target',
            'entrepreneursTier2', 'entrepreneursTier2Target',
            'entrepreneursTier1', 'entrepreneursTier1Target',
        ],
    },
    REVENUE: {
        title: 'Revenue & Projections',
        fields: [
            'revenueImpactedBillions', 'revenueMillions', 'netProfitPercent',
            'revenue2026Millions', 'revenue2027Millions', 'revenue2028Millions',
        ],
    },
    PROFITABILITY: {
        title: 'Profitability',
        fields: ['netProfitPercentProjection', 'grossProfitPercent', 'fcfEst'],
    },
    VALUATION: {
        title: 'Valuation',
        fields: [
            'valuePerEntrepreneurThousands',
            'value2024MillionsEst', 'value2025MillionsEst',
            'value2026MillionsEst', 'value2027MillionsEst', 'value2028BillionsEst',
        ],
    },
    FINANCING: {
        title: 'Financing',
        fields: ['nettDebtThousands', 'ask2026', 'offer2026', 'highlights'],
    },
} as const;

/**
 * Field labels for display
 */
export const FIELD_LABELS: Record<keyof Omit<CampaignBusinessDetailsInput, 'campaignAddress' | 'ownerAddress'>, string> = {
    who1: 'Primary Team Member',
    who2: 'Team Member 2',
    who3: 'Team Member 3',
    quantity: 'Quantity (estimated)',
    introVideo: 'Intro Video URL',
    wishDreamPrayer: 'Wish/Dream/Prayer',
    urgent: 'Urgent Priority',
    rank: 'Rank',
    ownership: 'Ownership %',
    what1: 'Primary Product/Service',
    what2: 'Secondary Product/Service',
    what3: 'Additional Product/Service',
    what4: 'Additional Product/Service',
    why1: 'Primary Value Proposition',
    why2: 'Secondary Value Proposition',
    why3: 'Additional Value Proposition',
    how: 'Strategy/Methodology',
    where: 'Target Market/Location',
    when: 'Timeline',
    concept: 'Concept Description',
    mvp: 'MVP Status',
    launchV1: 'Launch v1 Status',
    currentVersion: 'Current Version',
    tamBillions: 'TAM (billions)',
    targetReach2028Billions: 'Target Reach by 2028 (billions)',
    strategies: 'Business Strategies',
    reachedEst: 'Reached (est)',
    subsEst: 'Subscribers (est)',
    convertedEst: 'Converted (est)',
    upsoldEst: 'Upsold (est)',
    advocatesEst: 'Advocates (est)',
    partnersEst: 'Partners (est)',
    cpaEst: 'CPA (est)',
    targetCPA: 'Target CPA',
    aspEst: 'ASP (est)',
    targetASP: 'Target ASP',
    cltv: 'CLTV',
    entrepreneursTier4: 'Entrepreneurs Tier 4',
    entrepreneursTier4Target: 'Tier 4 Target (m)',
    entrepreneursTier3: 'Entrepreneurs Tier 3',
    entrepreneursTier3Target: 'Tier 3 Target (k)',
    entrepreneursTier2: 'Entrepreneurs Tier 2',
    entrepreneursTier2Target: 'Tier 2 Target (k)',
    entrepreneursTier1: 'Entrepreneurs Tier 1',
    entrepreneursTier1Target: 'Tier 1 Target (k)',
    revenueImpactedBillions: 'Revenue Impacted ($b)',
    highlights: 'Highlights',
    revenueMillions: 'Revenue ($m)',
    netProfitPercent: '% Net Profit (est)',
    revenue2026Millions: 'Revenue 2026 ($m)',
    revenue2027Millions: 'Revenue 2027 ($m)',
    revenue2028Millions: 'Revenue 2028 ($m)',
    netProfitPercentProjection: '% Net Profit Projection',
    grossProfitPercent: '% Gross Profit (est)',
    fcfEst: 'FCF (est)',
    valuePerEntrepreneurThousands: 'Value Per Entrepreneur ($k)',
    value2024MillionsEst: 'Value 2024 ($m est)',
    value2025MillionsEst: 'Value 2025 ($m est)',
    value2026MillionsEst: 'Value 2026 ($m est)',
    value2027MillionsEst: 'Value 2027 ($m est)',
    value2028BillionsEst: 'Value 2028 ($b est)',
    nettDebtThousands: 'Net Debt ($k)',
    ask2026: '2026 Ask ($)',
    offer2026: '2026 Offer',
};
