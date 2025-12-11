import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
    walletAddress: string;
    email?: string;
    name?: string;
    profileImage?: string;
    provider?: string;
    web3AuthId?: string;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        walletAddress: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            index: true,
        },
        email: {
            type: String,
            lowercase: true,
            sparse: true,
            index: true,
        },
        name: {
            type: String,
        },
        profileImage: {
            type: String,
        },
        provider: {
            type: String,
            enum: ['web3', 'google', 'apple', 'email', 'unknown'],
            default: 'unknown',
        },
        web3AuthId: {
            type: String,
            sparse: true,
            index: true,
        },
        emailVerified: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Create compound index for faster queries
UserSchema.index({ walletAddress: 1, provider: 1 });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
