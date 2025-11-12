import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
import DonorEmail from '@/lib/db/models/DonorEmail';
import { sendEmail } from '@/lib/services/emailService';
import {
    milestoneCreatedEmail,
    milestoneApprovedEmail,
    campaignEndedEmail,
} from '@/lib/email-templates/campaignUpdates'; type UpdateType = 'milestone_created' | 'milestone_approved' | 'campaign_ended';

interface EmailPayload {
    campaignId: string;
    campaignTitle: string;
    updateType: UpdateType;
    data: {
        milestoneNumber?: number;
        votingDeadline?: string;
        approvalPercentage?: string;
        totalRaised?: string;
        goalAchieved?: boolean;
    };
}

export async function POST(request: NextRequest) {
    try {
        const body: EmailPayload = await request.json();
        const { campaignId, campaignTitle, updateType, data } = body;

        // Validate required fields
        if (!campaignId || !campaignTitle || !updateType) {
            return NextResponse.json(
                { error: 'Missing required fields: campaignId, campaignTitle, updateType' },
                { status: 400 }
            );
        }

        // Connect to database
        await connectDB();

        // Get all subscribed donors for this campaign
        const subscribedDonors = await DonorEmail.find({
            campaignId: campaignId.toLowerCase(),
            subscribed: true,
        });

        if (subscribedDonors.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No subscribers found for this campaign',
                emailsSent: 0,
            });
        }

        // Generate email content based on update type
        let emailHtml: string;
        let subject: string;

        switch (updateType) {
            case 'milestone_created':
                if (!data.milestoneNumber || !data.votingDeadline) {
                    return NextResponse.json(
                        { error: 'Missing required data for milestone_created: milestoneNumber, votingDeadline' },
                        { status: 400 }
                    );
                }
                subject = `New Milestone Ready for Voting - ${campaignTitle}`;
                emailHtml = milestoneCreatedEmail(
                    campaignTitle,
                    campaignId,
                    data.milestoneNumber,
                    data.votingDeadline
                );
                break;

            case 'milestone_approved':
                if (!data.milestoneNumber || !data.approvalPercentage) {
                    return NextResponse.json(
                        { error: 'Missing required data for milestone_approved: milestoneNumber, approvalPercentage' },
                        { status: 400 }
                    );
                }
                subject = `Milestone Approved - ${campaignTitle}`;
                emailHtml = milestoneApprovedEmail(
                    campaignTitle,
                    campaignId,
                    data.milestoneNumber,
                    data.approvalPercentage
                );
                break;

            case 'campaign_ended':
                if (!data.totalRaised || data.goalAchieved === undefined) {
                    return NextResponse.json(
                        { error: 'Missing required data for campaign_ended: totalRaised, goalAchieved' },
                        { status: 400 }
                    );
                }
                subject = `Campaign Ended - ${campaignTitle}`;
                emailHtml = campaignEndedEmail(
                    campaignTitle,
                    campaignId,
                    data.totalRaised,
                    data.goalAchieved
                );
                break;

            default:
                return NextResponse.json(
                    { error: `Invalid update type: ${updateType}` },
                    { status: 400 }
                );
        }

        // Send emails to all subscribers
        const emailPromises = subscribedDonors.map((donor: any) =>
            sendEmail({
                to: donor.email,
                subject,
                html: emailHtml,
            }).catch((error: any) => {
                console.error(`Failed to send email to ${donor.email}:`, error);
                return false;
            })
        );

        const results = await Promise.all(emailPromises);
        const successCount = results.filter((result: any) => result === true).length;

        return NextResponse.json({
            success: true,
            message: `Campaign update emails sent`,
            emailsSent: successCount,
            totalSubscribers: subscribedDonors.length,
        });
    } catch (error: any) {
        console.error('Error sending campaign updates:', error);
        return NextResponse.json(
            { error: 'Failed to send campaign updates', details: error.message },
            { status: 500 }
        );
    }
}

// Optional: GET endpoint to get subscriber count for a campaign
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const campaignId = searchParams.get('campaignId');

        if (!campaignId) {
            return NextResponse.json(
                { error: 'Missing required parameter: campaignId' },
                { status: 400 }
            );
        }

        await connectDB();

        const subscriberCount = await DonorEmail.countDocuments({
            campaignId: campaignId.toLowerCase(),
            subscribed: true,
        });

        return NextResponse.json({
            campaignId,
            subscriberCount,
        });
    } catch (error: any) {
        console.error('Error getting subscriber count:', error);
        return NextResponse.json(
            { error: 'Failed to get subscriber count', details: error.message },
            { status: 500 }
        );
    }
}
