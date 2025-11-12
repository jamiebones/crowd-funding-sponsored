import { gql } from '@apollo/client';

export const GET_PLATFORM_STATS = gql`
  query GetPlatformStats {
    campaigns(first: 1000) {
      id
      content {
        title
      }
      amountRaised
      campaignRunning
      dateCreated
      backers
    }
    campaignCreators(first: 1000) {
      id
    }
    donors(first: 1000) {
      id
    }
    milestones(first: 1000) {
      id
    }
    votes(first: 1000) {
      id
    }
  }
`;

export const GET_RECENT_CAMPAIGNS = gql`
  query GetRecentCampaigns {
    campaigns(
      first: 20
      orderBy: dateCreated
      orderDirection: desc
    ) {
      id
      campaignCID
      content {
        title
      }
      category
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
