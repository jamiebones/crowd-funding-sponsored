import mongoose, { Schema, Document } from 'mongoose';
import { ICampaignDoc } from '@/app/interface/ICampaignDoc';



const DonorSchema = new Schema({
  email: { type: String, required: true },
  wallet_address: { type: String, required: true }
});

const CampaignSchema = new Schema({
  campaignAddress: { type: String, required: true },
  donors: [DonorSchema]
});

const CampaignOwnerSchema = new Schema({
  owner: { type: String, required: true },
  email: { type: String, required: true },
  campaigns: [CampaignSchema]
});

export default mongoose.models.Campaign || mongoose.model<ICampaignDoc>('Campaign', CampaignOwnerSchema);