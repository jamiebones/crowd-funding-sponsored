import mongoose, { Schema, model, models, Document } from 'mongoose';

export interface IDonorEmail extends Document {
    walletAddress: string;
    email: string;
    campaignId: string;
    subscribed: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const DonorEmailSchema = new Schema<IDonorEmail>(
    {
        walletAddress: {
            type: String,
            required: [true, 'Wallet address is required'],
            lowercase: true,
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            lowercase: true,
            trim: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                'Please provide a valid email address',
            ],
        },
        campaignId: {
            type: String,
            required: [true, 'Campaign ID is required'],
            lowercase: true,
            trim: true,
        },
        subscribed: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Create compound index to ensure one email per wallet per campaign
DonorEmailSchema.index({ walletAddress: 1, campaignId: 1 }, { unique: true });

// Create index for efficient lookups
DonorEmailSchema.index({ campaignId: 1, subscribed: 1 });

const DonorEmail = models.DonorEmail || model<IDonorEmail>('DonorEmail', DonorEmailSchema);

export default DonorEmail;
