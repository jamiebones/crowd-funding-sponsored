import { gql } from '@apollo/client';

export const GET_PLATFORM_STATISTICS = gql`
  query GetPlatformStatistics {
    statistics(first: 1) {
      id
      totalCampaigns
      totalAmountRaised
      totalBackers
      totalCampaignsEnded
      totalCampaignsRunning
    }
  }
`;

export const GET_FEATURED_CAMPAIGNS = gql`
  query GetFeaturedCampaigns($first: Int = 6) {
    campaigns(
      first: $first
      orderBy: amountRaised
      orderDirection: desc
      where: { campaignRunning: true }
    ) {
      id
      campaignCID
      category
      title
      amountSought
      amountRaised
      backers
      campaignRunning
      dateCreated
      owner {
        id
      }
      milestone {
        id
        status
      }
    }
  }
`;

export const GET_CATEGORY_COUNTS = gql`
  query GetCategoryCounts {
    campaigns(where: { campaignRunning: true }) {
      category
    }
  }
`;

export const GET_RECENT_CAMPAIGNS = gql`
  query GetRecentCampaigns($first: Int = 3) {
    campaigns(
      first: $first
      orderBy: dateCreated
      orderDirection: desc
      where: { campaignRunning: true }
    ) {
      id
      campaignCID
      category
      title
      amountSought
      amountRaised
      backers
      campaignRunning
      dateCreated
      owner {
        id
      }
    }
  }
`;
