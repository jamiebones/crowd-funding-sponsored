import { gql } from '@apollo/client';

export const GET_USER_PROFILE = gql`
  query GetUserProfile($address: String!) {
    campaignCreator(id: $address) {
      id
      totalCampaignsCreated
      campaigns {
        id
        title
        category
        amountSought
        amountRaised
        backers
        campaignRunning
        dateCreated
        campaignCID
      }
    }
    donor(id: $address) {
      id
      totalDonated
      totalWithdrawn
      donations {
        id
        amount
        dateCreated
        campaign {
          id
          title
          campaignCID
        }
      }
      votes {
        id
        support
        weight
        dateCreated
        milestone {
          id
          milestoneCID
          campaign {
            id
            title
          }
        }
      }
    }
  }
`;
