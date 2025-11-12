import { gql } from '@apollo/client';

export const GET_CAMPAIGNS_BY_CATEGORY = gql`
  query GetCampaignsByCategory($category: Int!) {
    campaigns(
      where: { category: $category }
      orderBy: dateCreated
      orderDirection: desc
      first: 1000
    ) {
      id
      content {
        title
      }
      category
      amountSought
      amountRaised
      backers
      campaignRunning
      dateCreated
      dateEnded
      campaignCID
      owner {
        id
      }
    }
  }
`;
