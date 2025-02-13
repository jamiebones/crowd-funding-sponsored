import { Document } from 'mongoose';

interface IDonor {
    email: string;
    wallet_address: string;
  }

interface ICampaign {
    campaignAddress: string;
    donors: IDonor[];
  }

export interface ICampaignDoc extends Document {
    owner: string;
    email: string;
    campaigns: ICampaign[];
  }