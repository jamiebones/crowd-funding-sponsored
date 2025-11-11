export interface Milestone {
  id: string;
  status: number;
  milestoneCID: string;
  voteCount: number;
  totalVotes: string;
  periodToVote?: string;
  votes?: Array<{
    id: string;
    voter: string;
    weight: string;
    support: boolean;
  }>;
}

export interface Campaign {
  id: string;
  campaignCID: string;
  category: number;
  title: string;
  amountSought: string;
  amountRaised: string;
  backers: number;
  campaignRunning: boolean;
  dateCreated: string;
  dateEnded?: string;
  owner: {
    id: string;
    totalCampaigns?: number;
    totalFundingReceived?: string;
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
