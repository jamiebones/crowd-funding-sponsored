import connectDB from '@/lib/db/connection';
import CampaignBusinessDetails from '@/lib/db/models/CampaignBusinessDetails';
import { CampaignBusinessDetailsInput, CampaignBusinessDetailsResponse } from '@/types/business-details';

/**
 * Server-side service for Campaign Business Details operations
 * Use these functions in API routes or server components
 */

export class BusinessDetailsService {
    /**
     * Get business details by campaign address
     */
    static async getByCampaignAddress(campaignAddress: string): Promise<CampaignBusinessDetailsResponse | null> {
        await connectDB();

        const details = await CampaignBusinessDetails.findOne({
            campaignAddress: campaignAddress.toLowerCase(),
        }).lean();

        return details as any;
    }

    /**
     * Get all business details for a campaign owner
     */
    static async getByOwnerAddress(ownerAddress: string): Promise<CampaignBusinessDetailsResponse[]> {
        await connectDB();

        const detailsList = await CampaignBusinessDetails.find({
            ownerAddress: ownerAddress.toLowerCase(),
        })
            .sort({ rank: 1, createdAt: -1 })
            .lean();

        return detailsList as any;
    }

    /**
     * Get all business details with pagination
     */
    static async getAll(page: number = 1, limit: number = 50) {
        await connectDB();

        const skip = (page - 1) * limit;

        const [detailsList, total] = await Promise.all([
            CampaignBusinessDetails.find()
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            CampaignBusinessDetails.countDocuments(),
        ]);

        return {
            data: detailsList as any,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get urgent campaigns sorted by rank
     */
    static async getUrgentCampaigns(limit: number = 10): Promise<CampaignBusinessDetailsResponse[]> {
        await connectDB();

        const urgentCampaigns = await CampaignBusinessDetails.find({ urgent: true })
            .sort({ rank: 1, createdAt: -1 })
            .limit(limit)
            .lean();

        return urgentCampaigns as any;
    }

    /**
     * Get campaigns by rank range
     */
    static async getByRankRange(minRank: number, maxRank: number): Promise<CampaignBusinessDetailsResponse[]> {
        await connectDB();

        const campaigns = await CampaignBusinessDetails.find({
            rank: { $gte: minRank, $lte: maxRank },
        })
            .sort({ rank: 1 })
            .lean();

        return campaigns as any;
    }

    /**
     * Create new business details
     */
    static async create(data: CampaignBusinessDetailsInput): Promise<CampaignBusinessDetailsResponse> {
        await connectDB();

        // Check if already exists
        const existing = await CampaignBusinessDetails.findOne({
            campaignAddress: data.campaignAddress.toLowerCase(),
        });

        if (existing) {
            throw new Error('Business details already exist for this campaign');
        }

        const businessDetails = new CampaignBusinessDetails({
            ...data,
            campaignAddress: data.campaignAddress.toLowerCase(),
            ownerAddress: data.ownerAddress.toLowerCase(),
        });

        await businessDetails.save();

        return businessDetails.toObject() as CampaignBusinessDetailsResponse;
    }

    /**
     * Update existing business details
     */
    static async update(
        campaignAddress: string,
        updates: Partial<CampaignBusinessDetailsInput>
    ): Promise<CampaignBusinessDetailsResponse> {
        await connectDB();

        const businessDetails = await CampaignBusinessDetails.findOneAndUpdate(
            { campaignAddress: campaignAddress.toLowerCase() },
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!businessDetails) {
            throw new Error('Business details not found for this campaign');
        }

        return businessDetails.toObject() as CampaignBusinessDetailsResponse;
    }

    /**
     * Delete business details
     */
    static async delete(campaignAddress: string): Promise<boolean> {
        await connectDB();

        const result = await CampaignBusinessDetails.findOneAndDelete({
            campaignAddress: campaignAddress.toLowerCase(),
        });

        return !!result;
    }

    /**
     * Check if business details exist
     */
    static async exists(campaignAddress: string): Promise<boolean> {
        await connectDB();

        const count = await CampaignBusinessDetails.countDocuments({
            campaignAddress: campaignAddress.toLowerCase(),
        });

        return count > 0;
    }

    /**
     * Get campaigns with high valuation projections
     */
    static async getHighValueCampaigns(minValue2028Billions: number = 1): Promise<CampaignBusinessDetailsResponse[]> {
        await connectDB();

        const campaigns = await CampaignBusinessDetails.find({
            value2028BillionsEst: { $gte: minValue2028Billions },
        })
            .sort({ value2028BillionsEst: -1 })
            .lean();

        return campaigns as any;
    }

    /**
     * Get campaigns seeking funding in 2026
     */
    static async getSeeking2026Funding(minAsk: number = 0): Promise<CampaignBusinessDetailsResponse[]> {
        await connectDB();

        const campaigns = await CampaignBusinessDetails.find({
            ask2026: { $gte: minAsk },
        })
            .sort({ ask2026: -1 })
            .lean();

        return campaigns as any;
    }

    /**
     * Get statistics for all business details
     */
    static async getStatistics() {
        await connectDB();

        const [
            total,
            urgentCount,
            avgAsk2026,
            totalAsk2026,
            avgTAM,
            campaigns,
        ] = await Promise.all([
            CampaignBusinessDetails.countDocuments(),
            CampaignBusinessDetails.countDocuments({ urgent: true }),
            CampaignBusinessDetails.aggregate([
                { $match: { ask2026: { $exists: true } } },
                { $group: { _id: null, avg: { $avg: '$ask2026' } } },
            ]),
            CampaignBusinessDetails.aggregate([
                { $match: { ask2026: { $exists: true } } },
                { $group: { _id: null, total: { $sum: '$ask2026' } } },
            ]),
            CampaignBusinessDetails.aggregate([
                { $match: { tamBillions: { $exists: true } } },
                { $group: { _id: null, avg: { $avg: '$tamBillions' } } },
            ]),
            CampaignBusinessDetails.find().select('value2028BillionsEst revenue2028Millions').lean(),
        ]);

        return {
            totalCampaigns: total,
            urgentCampaigns: urgentCount,
            averageAsk2026: avgAsk2026[0]?.avg || 0,
            totalAsk2026: totalAsk2026[0]?.total || 0,
            averageTAM: avgTAM[0]?.avg || 0,
            campaigns: campaigns.length,
        };
    }

    /**
     * Search business details by text
     */
    static async search(query: string, limit: number = 20): Promise<CampaignBusinessDetailsResponse[]> {
        await connectDB();

        const searchRegex = new RegExp(query, 'i');

        const results = await CampaignBusinessDetails.find({
            $or: [
                { who1: searchRegex },
                { who2: searchRegex },
                { who3: searchRegex },
                { what1: searchRegex },
                { what2: searchRegex },
                { what3: searchRegex },
                { what4: searchRegex },
                { why1: searchRegex },
                { why2: searchRegex },
                { why3: searchRegex },
                { concept: searchRegex },
                { strategies: searchRegex },
                { highlights: searchRegex },
            ],
        })
            .limit(limit)
            .lean();

        return results as any;
    }
}

/**
 * Example usage in API routes:
 * 
 * import { BusinessDetailsService } from '@/lib/services/businessDetailsService';
 * 
 * export async function GET(request: NextRequest) {
 *   const details = await BusinessDetailsService.getByCampaignAddress('0x123...');
 *   return NextResponse.json({ data: details });
 * }
 */
