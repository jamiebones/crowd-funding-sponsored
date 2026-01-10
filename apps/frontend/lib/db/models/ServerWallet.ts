import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IServerWallet extends Document {
    address: string;
    encryptedPrivateKey: string;
    salt: string;
    campaignCount: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const serverWalletSchema = new Schema<IServerWallet>(
    {
        address: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            match: /^0x[a-fA-F0-9]{40}$/,
            index: true
        },
        encryptedPrivateKey: {
            type: String,
            required: true
        },
        salt: {
            type: String,
            required: true
        },
        campaignCount: {
            type: Number,
            default: 0,
            min: 0
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

// Index for querying active wallets
serverWalletSchema.index({ isActive: 1, campaignCount: 1 });

const ServerWallet: Model<IServerWallet> =
    mongoose.models.ServerWallet ||
    mongoose.model<IServerWallet>('ServerWallet', serverWalletSchema);

export default ServerWallet;
