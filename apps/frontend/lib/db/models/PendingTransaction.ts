import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPendingTransaction extends Document {
    txHash: string;
    walletAddress: string;
    type: 'CAMPAIGN_CREATION' | 'MILESTONE_CREATION' | 'WITHDRAWAL';
    status: 'PENDING' | 'CONFIRMED' | 'FAILED';
    metadata: {
        campaignAddress?: string;
        arweaveTxId?: string;
        title?: string;
        category?: number;
        goal?: string;
        duration?: number;
        [key: string]: any;
    };
    blockNumber?: number;
    gasUsed?: string;
    errorMessage?: string;
    createdAt: Date;
    confirmedAt?: Date;
}

const pendingTransactionSchema = new Schema<IPendingTransaction>(
    {
        txHash: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        walletAddress: {
            type: String,
            required: true,
            lowercase: true,
            index: true
        },
        type: {
            type: String,
            required: true,
            enum: ['CAMPAIGN_CREATION', 'MILESTONE_CREATION', 'WITHDRAWAL']
        },
        status: {
            type: String,
            required: true,
            enum: ['PENDING', 'CONFIRMED', 'FAILED'],
            default: 'PENDING',
            index: true
        },
        metadata: {
            type: Schema.Types.Mixed,
            default: {}
        },
        blockNumber: {
            type: Number,
            sparse: true
        },
        gasUsed: {
            type: String,
            sparse: true
        },
        errorMessage: {
            type: String,
            sparse: true
        },
        confirmedAt: {
            type: Date,
            sparse: true
        }
    },
    {
        timestamps: { createdAt: true, updatedAt: false }
    }
);

// Compound indexes for efficient queries
pendingTransactionSchema.index({ status: 1, createdAt: -1 });
pendingTransactionSchema.index({ walletAddress: 1, status: 1 });

// TTL index to auto-delete confirmed/failed transactions after 7 days
pendingTransactionSchema.index(
    { confirmedAt: 1 },
    { expireAfterSeconds: 7 * 24 * 60 * 60, partialFilterExpression: { status: { $in: ['CONFIRMED', 'FAILED'] } } }
);

const PendingTransaction: Model<IPendingTransaction> =
    mongoose.models.PendingTransaction ||
    mongoose.model<IPendingTransaction>('PendingTransaction', pendingTransactionSchema);

export default PendingTransaction;
