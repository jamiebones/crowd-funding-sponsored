import { gql } from '@apollo/client';

export const GET_PLATFORM_STATS = gql`
  query GetPlatformStats {
    statistics {
      id
      totalContracts
      totalFundingRequest
      totalBackers
      totalWithdrawals
      totalFundingGiven
    }
    campaigns(first: 1000) {
      id
      category
      amountRaised
      amountSought
      campaignRunning
      backers
    }
  }
`;

export interface PlatformStatsData {
  statistics?: Array<{
    id: string;
    totalContracts: string;
    totalFundingRequest: string;
    totalBackers: string;
    totalWithdrawals: string;
    totalFundingGiven: string;
  }>;
  campaigns: Array<{
    id: string;
    category: number;
    amountRaised: string;
    amountSought: string;
    campaignRunning: boolean;
    backers: string;
  }>;
}
