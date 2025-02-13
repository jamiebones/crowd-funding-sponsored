import mongoose, { Schema, Document } from 'mongoose';
import { EmailType } from '@/app/types/EmailType';
import { IEmailCampaign } from '@/app/interface/IEmailCampaign';


const RecipientSchema = new Schema({
    id: { type: String, required: true },
    email: { type: String, required: true }
  });
  
  const EmailCampaignSchema = new Schema({
    date: { type: Date, default: Date.now },
    emailType: { 
      type: String, 
      enum: Object.values(EmailType),
      required: true 
    },
    recipients: [RecipientSchema]
  });
  
  export default mongoose.models.EmailCampaign || mongoose.model<IEmailCampaign>('EmailCampaign', EmailCampaignSchema);