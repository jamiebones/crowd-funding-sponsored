import Campaign from "@/app/interface/Campaign";

export class RecommendationService {
    private static readonly SIMILARITY_WEIGHTS = {
        CATEGORY: 0.3,
        AMOUNT: 0.2,
        CONTENT: 0.5,
    };

    private static readonly MAX_RECOMMENDATIONS = 6;

    static calculateSimilarityScore(source: Campaign, target: Campaign): number {
        if (source.id === target.id) return 0;

        // Add safety checks for null content
        if (!source.content || !target.content) {
            return 0; // Return 0 similarity if either campaign has no content
        }

        let score = 0;

        // Category similarity
        if (source.category === target.category) {
            score += this.SIMILARITY_WEIGHTS.CATEGORY;
        }

        // Amount similarity (normalized)
        const amountDiff = Math.abs(+source.amountSought - +target.amountSought);
        const amountScore = 1 - (amountDiff / Math.max(+source.amountSought, +target.amountSought));
        score += amountScore * this.SIMILARITY_WEIGHTS.AMOUNT;

        // Content similarity (using basic text matching)
        const sourceText = `${source.content.title || ''} ${source.content.details || ''}`.toLowerCase();
        const targetText = `${target.content.title || ''} ${target.content.details || ''}`.toLowerCase();
        const contentScore = this.calculateTextSimilarity(sourceText, targetText);
        score += contentScore * this.SIMILARITY_WEIGHTS.CONTENT;

        return score;
    }

    private static calculateTextSimilarity(text1: string, text2: string): number {
        const words1 = new Set(text1.split(/\s+/));
        const words2 = new Set(text2.split(/\s+/));
        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);
        return intersection.size / union.size;
    }

    static getRecommendations(sourceCampaign: Campaign, allCampaigns: Campaign[]): Campaign[] {
        // Filter out campaigns with null/missing content and the source campaign itself
        const validCampaigns = allCampaigns.filter(campaign => 
            campaign.content && 
            campaign.content.title && 
            campaign.id !== sourceCampaign.id
        );

        const recommendations = validCampaigns
            .map(campaign => ({
                campaign,
                score: this.calculateSimilarityScore(sourceCampaign, campaign)
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, this.MAX_RECOMMENDATIONS)
            .map(item => item.campaign);

        return recommendations;
    }
}   