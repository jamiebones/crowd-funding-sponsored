import { gql } from '@apollo/client';

export const GET_CAMPAIGN_DETAIL = gql`
  query GetCampaignDetail($id: ID!) {
    campaign(id: $id) {
      id
      campaignCID
      category
      title
      amountSought
      amountRaised
      backers
      campaignRunning
      dateCreated
      dateEnded
      owner {
        id
        totalCampaigns
        totalFundingReceived
      }
      milestone {
        id
        milestoneCID
        status
        voteCount
        totalVotes
        periodToVote
        votes {
          id
          voter
          support
          weight
        }
      }
      donations {
        id
        donor {
          id
        }
        amount
        timestamp
      }
    }
  }
`;

export const GET_CAMPAIGN_DONATIONS = gql`
  query GetCampaignDonations($campaignId: String!, $first: Int = 10) {
    donations(
      where: { campaign: $campaignId }
      first: $first
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      donor {
        id
      }
      amount
      timestamp
    }
  }
`;

export const GET_CAMPAIGN_MILESTONES = gql`
  query GetCampaignMilestones($campaignId: String!) {
    milestones(
      where: { campaign: $campaignId }
      orderBy: createdAt
      orderDirection: asc
    ) {
      id
      milestoneCID
      status
      voteCount
      totalVotes
      periodToVote
      createdAt
    }
  }
`;
