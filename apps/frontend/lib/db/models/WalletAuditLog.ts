import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWalletAuditLog extends Document {
    walletAddress: string;
    action: 'CREATED' | 'CAMPAIGN_CREATED' | 'BALANCE_UPDATED' | 'DEACTIVATED' | 'REACTIVATED' | 'TRANSACTION_SIGNED' | 'DELETED';
    txHash?: string;
    metadata: Record<string, any>;
    performedBy?: string; // Admin address or 'SYSTEM'
    timestamp: Date;
}

const walletAuditLogSchema = new Schema<IWalletAuditLog>(
    {
        walletAddress: {
            type: String,
            required: true,
            lowercase: true,
            index: true
        },
        action: {
            type: String,
            required: true,
            enum: ['CREATED', 'CAMPAIGN_CREATED', 'BALANCE_UPDATED', 'DEACTIVATED', 'REACTIVATED', 'TRANSACTION_SIGNED', 'DELETED']
        },
        txHash: {
            type: String,
            sparse: true
        },
        metadata: {
            type: Schema.Types.Mixed,
            default: {}
        },
        performedBy: {
            type: String,
            default: 'SYSTEM'
        },
        timestamp: {
            type: Date,
            default: Date.now,
            index: true
        }
    },
    {
        timestamps: false
    }
);

// Compound index for efficient queries
walletAuditLogSchema.index({ walletAddress: 1, timestamp: -1 });
walletAuditLogSchema.index({ action: 1, timestamp: -1 });

// Delete the model if it exists to avoid caching issues with enum updates
if (mongoose.models.WalletAuditLog) {
    delete mongoose.models.WalletAuditLog;
}

const WalletAuditLog: Model<IWalletAuditLog> =
    mongoose.model<IWalletAuditLog>('WalletAuditLog', walletAuditLogSchema);

export default WalletAuditLog;
