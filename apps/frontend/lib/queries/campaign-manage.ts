import { gql } from '@apollo/client';

export const GET_CAMPAIGN_MANAGE_DATA = gql`
  query GetCampaignManageData($id: ID!) {
    campaign(id: $id) {
      id
      contractAddress
      campaignCID
      category
      content {
        title
      }
      amountSought
      amountRaised
      backers
      owner {
        id
        totalCampaigns
        fundingGiven
      }
      campaignRunning
      dateCreated
      endDate
      milestone {
        id
        milestoneCID
        status
        periodToVote
        dateCreated
        votes {
          id
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
      donorsRecall {
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
