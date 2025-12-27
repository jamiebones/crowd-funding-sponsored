import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_CONFIG } from '@/lib/stripe/config';
import connectDB from '@/lib/db/connection';
import Payment from '@/lib/db/models/Payment';
import { getUserFromSession } from '@/lib/session';

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromSession();
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized - Please login first' },
                { status: 401 }
            );
        }
        const body = await request.json();
        const { campaignAddress, amountUSD, campaignTitle } = body;

        console.log('Create checkout session:', { userId: user._id, campaignAddress, amountUSD });

        // Validation
        if (!campaignAddress || !amountUSD) {
            return NextResponse.json(
                { error: 'Campaign address and amount are required' },
                { status: 400 }
            );
        }

        if (!/^0x[a-fA-F0-9]{40}$/.test(campaignAddress)) {
            return NextResponse.json(
                { error: 'Invalid campaign address format' },
                { status: 400 }
            );
        }

        if (amountUSD < 1) {
            return NextResponse.json(
                { error: 'Minimum donation amount is $1' },
                { status: 400 }
            );
        }

        await connectDB();

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: STRIPE_CONFIG.currency,
                        product_data: {
                            name: `Donation to ${campaignTitle || 'Crowdfunding Campaign'}`,
                            description: `Campaign: ${campaignAddress.slice(0, 10)}...${campaignAddress.slice(-8)}`,
                        },
                        unit_amount: Math.round(amountUSD * 100), // Convert to cents
                    },
                    quantity: 1,
                },
            ],
            success_url: STRIPE_CONFIG.successUrl,
            cancel_url: STRIPE_CONFIG.cancelUrl,
            metadata: {
                userId: user._id.toString(),
                campaignAddress: campaignAddress.toLowerCase(),
                campaignTitle: campaignTitle || '',
            },
            customer_email: user.email,
        });

        // Create payment record in database
        await Payment.create({
            userId: user._id,
            campaignAddress: campaignAddress.toLowerCase(),
            stripeSessionId: session.id,
            amountUSD,
            status: 'pending',
            metadata: {
                campaignTitle,
                donorEmail: user.email,
                donorName: user.name,
            },
        });

        console.log('Checkout session created:', session.id);

        return NextResponse.json(
            {
                success: true,
                sessionId: session.id,
                url: session.url,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Error creating checkout session:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create checkout session' },
            { status: 500 }
        );
    }
}
