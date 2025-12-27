import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPayment extends Document {
    userId: mongoose.Types.ObjectId;
    campaignAddress: string;
    stripeSessionId: string;
    stripePaymentIntentId?: string;
    amountUSD: number;
    amountBNB?: number;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
    donationTxHash?: string;
    errorMessage?: string;
    metadata?: {
        campaignTitle?: string;
        donorEmail?: string;
        donorName?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        campaignAddress: {
            type: String,
            required: true,
            lowercase: true,
            index: true,
        },
        stripeSessionId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        stripePaymentIntentId: {
            type: String,
            index: true,
        },
        amountUSD: {
            type: Number,
            required: true,
        },
        amountBNB: {
            type: Number,
        },
        status: {
            type: String,
            enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
            default: 'pending',
            index: true,
        },
        donationTxHash: {
            type: String,
            index: true,
        },
        errorMessage: {
            type: String,
        },
        metadata: {
            campaignTitle: String,
            donorEmail: String,
            donorName: String,
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for efficient queries
PaymentSchema.index({ userId: 1, status: 1 });
PaymentSchema.index({ campaignAddress: 1, status: 1 });
PaymentSchema.index({ createdAt: -1 });

const Payment: Model<IPayment> = mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);

export default Payment;
