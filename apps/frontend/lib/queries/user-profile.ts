import { gql } from '@apollo/client';

export const GET_USER_PROFILE = gql`
  query GetUserProfile($address: String!) {
    campaignCreator(id: $address) {
      id
      totalCampaigns
      fundingGiven
      createdCampaigns {
        id
        contractAddress
        campaignCID
        category
        amountSought
        amountRaised
        backers
        campaignRunning
        dateCreated
        content {
          title
        }
      }
    }
    donor(id: $address) {
      id
      totalDonated
      totalWithdrawn
      donations {
        id
        amount
        timestamp
        donatingTo {
          id
          contractAddress
          campaignCID
          content {
            title
          }
        }
      }
    }
    votes(where: { voter: $address }) {
      id
      support
      weight
      timestamp
      milestone {
        id
        milestoneCID
        campaign {
          id
          contractAddress
          campaignCID
          content {
            title
          }
        }
      }
    }
  }
`;
