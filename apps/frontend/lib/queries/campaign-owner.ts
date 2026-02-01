import { gql } from '@apollo/client';

export const GET_CAMPAIGN_OWNER = gql`
  query GetCampaignOwner($id: ID!) {
    campaign(id: $id) {
      id
      owner {
        id
      }
    }
  }
`;
