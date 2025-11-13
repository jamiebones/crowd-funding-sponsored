export interface Milestone {
  id: string;
  status: number;
  milestoneCID: string;
  periodToVote?: string;
  dateCreated?: string;
  votes?: Array<{
    id: string;
    voter: string;
    weight: string;
    support: boolean;
  }>;
}

export interface Campaign {
  id: string;
  contractAddress?: string; // The actual contract address (not the encoded ID)
  campaignCID: string;
  category: number;
  title?: string; // Deprecated: kept for backward compatibility, use content.title instead
  content?: {
    title: string;
  };
  amountSought: string;
  amountRaised: string;
  backers: number;
  campaignRunning: boolean;
  dateCreated: string;
  dateEnded?: string; // Deprecated
  endDate?: string; // Correct field name from schema
  owner: {
    id: string;
    totalCampaigns?: number;
    fundingGiven?: string; // Correct field name from schema
    totalFundingReceived?: string; // Deprecated, for backward compatibility
  };
  milestone?: Milestone[];
  donations?: Array<{
    id: string;
    donor: {
      id: string;
    };
    amount: string;
    timestamp: string;
  }>;
  donorsRecall?: Array<{
    id: string;
    donor: {
      id: string;
    } | string;
    amount: string;
    timestamp: string;
  }>;
}

export interface Statistics {
  id: string;
  totalCampaigns: number;
  totalAmountRaised: string;
  totalBackers: number;
  totalCampaignsEnded: number;
  totalCampaignsRunning: number;
}

export interface CampaignContent {
  details: string;
  title: string;
  media: string[];
  hash: string;
}
