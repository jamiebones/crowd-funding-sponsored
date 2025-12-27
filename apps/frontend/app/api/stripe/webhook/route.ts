import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe/config';
import connectDB from '@/lib/db/connection';
import Payment from '@/lib/db/models/Payment';
import User from '@/lib/db/models/User';
import Stripe from 'stripe';
import { calculateBNBConversion } from '@/lib/crypto/bnb-conversion';

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const headersList = await headers();
        const signature = headersList.get('stripe-signature');

        if (!signature) {
            console.error('No Stripe signature found');
            return NextResponse.json(
                { error: 'No signature' },
                { status: 400 }
            );
        }

        if (!WEBHOOK_SECRET) {
            console.error('STRIPE_WEBHOOK_SECRET not configured');
            return NextResponse.json(
                { error: 'Webhook secret not configured' },
                { status: 500 }
            );
        }

        // Verify webhook signature
        let event: Stripe.Event;
        try {
            event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
        } catch (err: any) {
            console.error('Webhook signature verification failed:', err.message);
            return NextResponse.json(
                { error: `Webhook Error: ${err.message}` },
                { status: 400 }
            );
        }

        console.log('Stripe webhook event:', event.type, event.id);

        await connectDB();

        // Handle different event types
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                console.log('Checkout session completed:', session.id);

                // Update payment record with payment intent ID
                const payment = await Payment.findOne({ stripeSessionId: session.id });
                if (!payment) {
                    console.error('Payment record not found for session:', session.id);
                    return NextResponse.json({ received: true });
                }

                payment.stripePaymentIntentId = session.payment_intent as string;
                await payment.save();

                console.log('Payment intent linked:', payment._id);

                break;
            }

            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;

                console.log('Payment intent succeeded:', paymentIntent.id);

                // Update payment status to processing (ready for crypto purchase)
                const payment = await Payment.findOneAndUpdate(
                    { stripePaymentIntentId: paymentIntent.id },
                    { status: 'processing' },
                    { new: true }
                );

                if (!payment) {
                    console.error('Payment not found for intent:', paymentIntent.id);
                    return NextResponse.json({ received: true });
                }

                console.log('Payment ready for crypto on-ramp:', payment._id);

                // Get user's wallet address
                const user = await User.findById(payment.userId);
                if (!user || !user.walletAddress) {
                    console.error('User or wallet address not found for payment:', payment._id);
                    await Payment.findByIdAndUpdate(payment._id, {
                        status: 'failed',
                        errorMessage: 'User wallet address not found'
                    });
                    return NextResponse.json({ received: true });
                }

                // Calculate BNB conversion details
                const conversion = await calculateBNBConversion({
                    amountUSD: payment.amountUSD,
                    campaignAddress: payment.campaignAddress,
                });

                if (!conversion.success) {
                    console.error('BNB conversion failed:', conversion.error);
                    await Payment.findByIdAndUpdate(payment._id, {
                        status: 'failed',
                        errorMessage: conversion.error || 'Conversion calculation failed'
                    });
                    return NextResponse.json({ received: true });
                }

                // Update payment with conversion details
                await Payment.findByIdAndUpdate(payment._id, {
                    amountBNB: conversion.netBNB, // Net amount after fees and gas
                    metadata: {
                        ...payment.metadata,
                        bnbPrice: conversion.bnbPrice,
                        grossBNB: conversion.amountBNB,
                        platformFee: conversion.platformFee,
                        estimatedGas: conversion.estimatedGas,
                        conversionTimestamp: new Date().toISOString(),
                    }
                });

                console.log('Payment ready for auto-donation:', {
                    paymentId: payment._id,
                    amountUSD: payment.amountUSD,
                    netBNB: conversion.netBNB,
                    campaign: payment.campaignAddress,
                });

                // Note: The actual donation execution will be handled by the auto-donation
                // executor service (next phase) which monitors 'processing' payments

                break;
            }

            case 'payment_intent.payment_failed': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;

                console.log('Payment intent failed:', paymentIntent.id);

                // Update payment status to failed
                await Payment.findOneAndUpdate(
                    { stripePaymentIntentId: paymentIntent.id },
                    {
                        status: 'failed',
                        errorMessage: paymentIntent.last_payment_error?.message || 'Payment failed'
                    }
                );

                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error('Webhook error:', error);
        return NextResponse.json(
            { error: error.message || 'Webhook handler failed' },
            { status: 500 }
        );
    }
}
