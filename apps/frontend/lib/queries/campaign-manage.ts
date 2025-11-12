import { gql } from '@apollo/client';

export const GET_CAMPAIGN_MANAGE_DATA = gql`
  query GetCampaignManageData($id: ID!) {
    campaign(id: $id) {
      id
      campaignCID
      category
      title
      amountSought
      amountRaised
      backers
      owner {
        id
        totalCampaigns
        totalRaised
      }
      campaignRunning
      dateCreated
      dateEnded
      milestone {
        id
        milestoneCID
        status
        amountToWithdraw
        amountWithdrawn
        periodToVote
        votesFor
        votesAgainst
        createdAt
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

export const GET_CAMPAIGN_DONORS = gql`
  query GetCampaignDonors($campaignId: ID!) {
    donations(
      where: { campaign: $campaignId }
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      donor {
        id
        totalDonated
        totalWithdrawn
      }
      amount
      timestamp
    }
  }
`;
