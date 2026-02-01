import mongoose, { Schema, model, models, Document } from 'mongoose';

export interface ICampaignBusinessDetails extends Document {
    campaignAddress: string;
    ownerAddress: string;

    // Team & Leadership
    who1: string;
    who2?: string;
    who3?: string;

    // Core Information
    quantity?: string; // estimated quantity
    introVideo?: string; // URL
    wishDreamPrayer?: string;
    urgent: boolean;
    rank?: number;
    ownership?: number; // percentage

    // Product/Service Details (What)
    what1: string;
    what2?: string;
    what3?: string;
    what4?: string;

    // Value Proposition (Why)
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
    tamBillions?: number; // Total Addressable Market in billions
    targetReach2028Billions?: number;
    strategies: string;

    // Customer Metrics
    reachedEst?: number;
    subsEst?: number; // subscribers
    convertedEst?: number;
    upsoldEst?: number;
    advocatesEst?: number;
    partnersEst?: number;

    // Economics
    cpaEst?: number; // Cost Per Acquisition
    targetCPA?: number;
    aspEst?: number; // Average Selling Price
    targetASP?: number;
    cltv?: number; // Customer Lifetime Value

    // Entrepreneur Segments
    entrepreneursTier4?: number;
    entrepreneursTier4Target?: string; // millions (m)
    entrepreneursTier3?: number;
    entrepreneursTier3Target?: string; // thousands (k)
    entrepreneursTier2?: number;
    entrepreneursTier2Target?: string; // thousands (k)
    entrepreneursTier1?: number;
    entrepreneursTier1Target?: string; // thousands (k)

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
    fcfEst?: number; // Free Cash Flow

    // Valuation
    valuePerEntrepreneurThousands?: number;
    value2024MillionsEst?: number;
    value2025MillionsEst?: number;
    value2026MillionsEst?: number;
    value2027MillionsEst?: number;
    value2028BillionsEst?: number;

    // Financing
    nettDebtThousands?: number;
    ask2026?: number; // Amount seeking in 2026
    offer2026?: string; // What's being offered (equity %, terms, etc.)

    // Metadata
    createdAt: Date;
    updatedAt: Date;
}

const CampaignBusinessDetailsSchema = new Schema<ICampaignBusinessDetails>(
    {
        campaignAddress: {
            type: String,
            required: [true, 'Campaign address is required'],
            lowercase: true,
            trim: true,
            unique: true,
        },
        ownerAddress: {
            type: String,
            required: [true, 'Owner address is required'],
            lowercase: true,
            trim: true,
        },

        // Team & Leadership
        who1: {
            type: String,
            required: [true, 'Primary team member (Who 1) is required'],
            trim: true,
        },
        who2: {
            type: String,
            trim: true,
        },
        who3: {
            type: String,
            trim: true,
        },

        // Core Information
        quantity: {
            type: String,
            trim: true,
        },
        introVideo: {
            type: String,
            trim: true,
            validate: {
                validator: function (v: string) {
                    if (!v) return true;
                    try {
                        new URL(v);
                        return true;
                    } catch {
                        return false;
                    }
                },
                message: 'Invalid video URL format',
            },
        },
        wishDreamPrayer: {
            type: String,
            trim: true,
        },
        urgent: {
            type: Boolean,
            default: false,
        },
        rank: {
            type: Number,
            min: 0,
        },
        ownership: {
            type: Number,
            min: 0,
            max: 100,
        },

        // Product/Service Details (What)
        what1: {
            type: String,
            required: [true, 'Primary product/service description (What 1) is required'],
            trim: true,
        },
        what2: {
            type: String,
            trim: true,
        },
        what3: {
            type: String,
            trim: true,
        },
        what4: {
            type: String,
            trim: true,
        },

        // Value Proposition (Why)
        why1: {
            type: String,
            required: [true, 'Primary value proposition (Why 1) is required'],
            trim: true,
        },
        why2: {
            type: String,
            trim: true,
        },
        why3: {
            type: String,
            trim: true,
        },

        // Strategy & Execution
        how: {
            type: String,
            required: [true, 'Strategy/methodology (How) is required'],
            trim: true,
        },
        where: {
            type: String,
            required: [true, 'Target location/market (Where) is required'],
            trim: true,
        },
        when: {
            type: String,
            required: [true, 'Timeline (When) is required'],
            trim: true,
        },

        // Development Stages
        concept: {
            type: String,
            required: [true, 'Concept description is required'],
            trim: true,
        },
        mvp: {
            type: String,
            trim: true,
        },
        launchV1: {
            type: String,
            trim: true,
        },
        currentVersion: {
            type: String,
            trim: true,
        },

        // Market Analysis
        tamBillions: {
            type: Number,
            min: 0,
        },
        targetReach2028Billions: {
            type: Number,
            min: 0,
        },
        strategies: {
            type: String,
            required: [true, 'Business strategies are required'],
            trim: true,
        },

        // Customer Metrics
        reachedEst: {
            type: Number,
            min: 0,
        },
        subsEst: {
            type: Number,
            min: 0,
        },
        convertedEst: {
            type: Number,
            min: 0,
        },
        upsoldEst: {
            type: Number,
            min: 0,
        },
        advocatesEst: {
            type: Number,
            min: 0,
        },
        partnersEst: {
            type: Number,
            min: 0,
        },

        // Economics
        cpaEst: {
            type: Number,
            min: 0,
        },
        targetCPA: {
            type: Number,
            min: 0,
        },
        aspEst: {
            type: Number,
            min: 0,
        },
        targetASP: {
            type: Number,
            min: 0,
        },
        cltv: {
            type: Number,
            min: 0,
        },

        // Entrepreneur Segments
        entrepreneursTier4: {
            type: Number,
            min: 0,
        },
        entrepreneursTier4Target: {
            type: String,
            trim: true,
        },
        entrepreneursTier3: {
            type: Number,
            min: 0,
        },
        entrepreneursTier3Target: {
            type: String,
            trim: true,
        },
        entrepreneursTier2: {
            type: Number,
            min: 0,
        },
        entrepreneursTier2Target: {
            type: String,
            trim: true,
        },
        entrepreneursTier1: {
            type: Number,
            min: 0,
        },
        entrepreneursTier1Target: {
            type: String,
            trim: true,
        },

        // Revenue & Financial Metrics
        revenueImpactedBillions: {
            type: Number,
            min: 0,
        },
        highlights: {
            type: String,
            trim: true,
        },
        revenueMillions: {
            type: Number,
            min: 0,
        },
        netProfitPercent: {
            type: Number,
            min: -100,
            max: 100,
        },

        // Revenue Projections
        revenue2026Millions: {
            type: Number,
            min: 0,
        },
        revenue2027Millions: {
            type: Number,
            min: 0,
        },
        revenue2028Millions: {
            type: Number,
            min: 0,
        },

        // Profitability Metrics
        netProfitPercentProjection: {
            type: Number,
            min: -100,
            max: 100,
        },
        grossProfitPercent: {
            type: Number,
            min: -100,
            max: 100,
        },
        fcfEst: {
            type: Number,
        },

        // Valuation
        valuePerEntrepreneurThousands: {
            type: Number,
            min: 0,
        },
        value2024MillionsEst: {
            type: Number,
            min: 0,
        },
        value2025MillionsEst: {
            type: Number,
            min: 0,
        },
        value2026MillionsEst: {
            type: Number,
            min: 0,
        },
        value2027MillionsEst: {
            type: Number,
            min: 0,
        },
        value2028BillionsEst: {
            type: Number,
            min: 0,
        },

        // Financing
        nettDebtThousands: {
            type: Number,
        },
        ask2026: {
            type: Number,
            min: 0,
        },
        offer2026: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient queries
CampaignBusinessDetailsSchema.index({ campaignAddress: 1 }, { unique: true });
CampaignBusinessDetailsSchema.index({ ownerAddress: 1 });
CampaignBusinessDetailsSchema.index({ urgent: 1, rank: 1 });
CampaignBusinessDetailsSchema.index({ createdAt: -1 });

// Compound index for owner's campaigns sorted by rank
CampaignBusinessDetailsSchema.index({ ownerAddress: 1, rank: 1 });

const CampaignBusinessDetails =
    models.CampaignBusinessDetails ||
    model<ICampaignBusinessDetails>('CampaignBusinessDetails', CampaignBusinessDetailsSchema);

export default CampaignBusinessDetails;
