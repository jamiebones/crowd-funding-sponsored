import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
import CampaignBusinessDetails from '@/lib/db/models/CampaignBusinessDetails';
import { CampaignBusinessDetailsInput } from '@/types/business-details';
import { verifyCampaignOwner } from '@/lib/utils/verifyCampaignOwner';

/**
 * GET /api/campaign-business-details?campaignAddress=0x...&ownerAddress=0x...
 * Fetch business details for a specific campaign or all campaigns by owner
 */
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const searchParams = request.nextUrl.searchParams;
        const campaignAddress = searchParams.get('campaignAddress');
        const ownerAddress = searchParams.get('ownerAddress');

        // If campaign address provided, return specific business details
        if (campaignAddress) {
            const businessDetails = await CampaignBusinessDetails.findOne({
                campaignAddress: campaignAddress.toLowerCase(),
            });

            if (!businessDetails) {
                return NextResponse.json(
                    { error: 'Business details not found for this campaign' },
                    { status: 404 }
                );
            }

            return NextResponse.json({ data: businessDetails }, { status: 200 });
        }

        // If owner address provided, return all their campaign business details
        if (ownerAddress) {
            const businessDetailsList = await CampaignBusinessDetails.find({
                ownerAddress: ownerAddress.toLowerCase(),
            }).sort({ rank: 1, createdAt: -1 });

            return NextResponse.json({ data: businessDetailsList }, { status: 200 });
        }

        // If no filters, return all (with pagination - limit 50)
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const skip = (page - 1) * limit;

        const [businessDetailsList, total] = await Promise.all([
            CampaignBusinessDetails.find()
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            CampaignBusinessDetails.countDocuments(),
        ]);

        return NextResponse.json({
            data: businessDetailsList,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        }, { status: 200 });

    } catch (error) {
        console.error('Error fetching campaign business details:', error);
        return NextResponse.json(
            { error: 'Failed to fetch campaign business details' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/campaign-business-details
 * Create new business details for a campaign
 */
export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const body: CampaignBusinessDetailsInput = await request.json();

        // Validate required fields
        if (!body.campaignAddress || !body.ownerAddress) {
            return NextResponse.json(
                { error: 'Campaign address and owner address are required' },
                { status: 400 }
            );
        }

        // Verify the user is the campaign owner
        const isOwner = await verifyCampaignOwner(
            body.campaignAddress,
            body.ownerAddress
        );

        if (!isOwner) {
            return NextResponse.json(
                { error: 'Unauthorized: You are not the owner of this campaign' },
                { status: 403 }
            );
        }

        // Check if business details already exist for this campaign
        const existing = await CampaignBusinessDetails.findOne({
            campaignAddress: body.campaignAddress.toLowerCase(),
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Business details already exist for this campaign. Use PUT to update.' },
                { status: 409 }
            );
        }

        // Create new business details
        const businessDetails = new CampaignBusinessDetails({
            ...body,
            campaignAddress: body.campaignAddress.toLowerCase(),
            ownerAddress: body.ownerAddress.toLowerCase(),
        });

        await businessDetails.save();

        return NextResponse.json(
            {
                message: 'Campaign business details created successfully',
                data: businessDetails
            },
            { status: 201 }
        );

    } catch (error: any) {
        console.error('Error creating campaign business details:', error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            return NextResponse.json(
                { error: 'Validation error', details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to create campaign business details' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/campaign-business-details
 * Update existing business details for a campaign
 */
export async function PUT(request: NextRequest) {
    try {
        await connectDB();

        const body: Partial<CampaignBusinessDetailsInput> & { campaignAddress: string } = await request.json();

        if (!body.campaignAddress) {
            return NextResponse.json(
                { error: 'Campaign address is required' },
                { status: 400 }
            );
        }

        // ownerAddress is required for authorization
        if (!body.ownerAddress) {
            return NextResponse.json(
                { error: 'Owner address is required for authorization' },
                { status: 400 }
            );
        }

        // Verify the user is the campaign owner
        const isOwner = await verifyCampaignOwner(
            body.campaignAddress,
            body.ownerAddress
        );

        if (!isOwner) {
            return NextResponse.json(
                { error: 'Unauthorized: You are not the owner of this campaign' },
                { status: 403 }
            );
        }

        // Find and update the business details
        const businessDetails = await CampaignBusinessDetails.findOneAndUpdate(
            { campaignAddress: body.campaignAddress.toLowerCase() },
            { $set: body },
            { new: true, runValidators: true }
        );

        if (!businessDetails) {
            return NextResponse.json(
                { error: 'Business details not found for this campaign' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                message: 'Campaign business details updated successfully',
                data: businessDetails,
            },
            { status: 200 }
        );

    } catch (error: any) {
        console.error('Error updating campaign business details:', error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            return NextResponse.json(
                { error: 'Validation error', details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to update campaign business details' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/campaign-business-details?campaignAddress=0x...
 * Delete business details for a campaign
 */
export async function DELETE(request: NextRequest) {
    try {
        await connectDB();

        const searchParams = request.nextUrl.searchParams;
        const campaignAddress = searchParams.get('campaignAddress');

        if (!campaignAddress) {
            return NextResponse.json(
                { error: 'Campaign address is required' },
                { status: 400 }
            );
        }

        // ownerAddress is required for authorization
        const ownerAddress = searchParams.get('ownerAddress');

        if (!ownerAddress) {
            return NextResponse.json(
                { error: 'Owner address is required for authorization' },
                { status: 400 }
            );
        }

        // Verify the user is the campaign owner
        const isOwner = await verifyCampaignOwner(
            campaignAddress,
            ownerAddress
        );

        if (!isOwner) {
            return NextResponse.json(
                { error: 'Unauthorized: You are not the owner of this campaign' },
                { status: 403 }
            );
        }

        const result = await CampaignBusinessDetails.findOneAndDelete({
            campaignAddress: campaignAddress.toLowerCase(),
        });

        if (!result) {
            return NextResponse.json(
                { error: 'Business details not found for this campaign' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { message: 'Campaign business details deleted successfully' },
            { status: 200 }
        );

    } catch (error) {
        console.error('Error deleting campaign business details:', error);
        return NextResponse.json(
            { error: 'Failed to delete campaign business details' },
            { status: 500 }
        );
    }
}
