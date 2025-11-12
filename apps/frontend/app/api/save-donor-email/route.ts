import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
import DonorEmail from '@/lib/db/models/DonorEmail';
import { sendEmail } from '@/lib/services/emailService';
import { welcomeDonorEmail } from '@/lib/email-templates/campaignUpdates';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { walletAddress, email, campaignId, campaignTitle, donationAmount } = body;

        // Validate required fields
        if (!walletAddress || !email || !campaignId) {
            return NextResponse.json(
                { error: 'Missing required fields: walletAddress, email, campaignId' },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Connect to database
        await connectDB();

        // Save or update donor email preference
        const donorEmail = await DonorEmail.findOneAndUpdate(
            {
                walletAddress: walletAddress.toLowerCase(),
                campaignId: campaignId.toLowerCase(),
            },
            {
                walletAddress: walletAddress.toLowerCase(),
                email: email.toLowerCase(),
                campaignId: campaignId.toLowerCase(),
                subscribed: true,
            },
            {
                upsert: true, // Create if doesn't exist
                new: true, // Return the updated document
                runValidators: true,
            }
        );

        // Send welcome email if campaign title and donation amount are provided
        if (campaignTitle && donationAmount) {
            try {
                await sendEmail({
                    to: email,
                    subject: 'Thank You for Your Donation!',
                    html: welcomeDonorEmail(campaignTitle, campaignId, donationAmount),
                });
            } catch (emailError) {
                console.error('Failed to send welcome email:', emailError);
                // Don't fail the request if email sending fails
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Email preference saved successfully',
            data: {
                id: donorEmail._id,
                walletAddress: donorEmail.walletAddress,
                email: donorEmail.email,
                campaignId: donorEmail.campaignId,
                subscribed: donorEmail.subscribed,
            },
        });
    } catch (error: any) {
        console.error('Error saving donor email:', error);

        // Handle duplicate key error (should not happen with findOneAndUpdate, but just in case)
        if (error.code === 11000) {
            return NextResponse.json(
                { error: 'Email preference already exists for this wallet and campaign' },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to save email preference', details: error.message },
            { status: 500 }
        );
    }
}

// Optional: GET endpoint to check if donor has subscribed to a campaign
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const walletAddress = searchParams.get('walletAddress');
        const campaignId = searchParams.get('campaignId');

        if (!walletAddress || !campaignId) {
            return NextResponse.json(
                { error: 'Missing required parameters: walletAddress, campaignId' },
                { status: 400 }
            );
        }

        await connectDB();

        const donorEmail = await DonorEmail.findOne({
            walletAddress: walletAddress.toLowerCase(),
            campaignId: campaignId.toLowerCase(),
        });

        if (!donorEmail) {
            return NextResponse.json({
                subscribed: false,
                email: null,
            });
        }

        return NextResponse.json({
            subscribed: donorEmail.subscribed,
            email: donorEmail.email,
        });
    } catch (error: any) {
        console.error('Error checking donor email:', error);
        return NextResponse.json(
            { error: 'Failed to check email preference', details: error.message },
            { status: 500 }
        );
    }
}
