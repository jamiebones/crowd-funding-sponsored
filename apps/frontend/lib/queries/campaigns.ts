import { gql } from '@apollo/client';

export const GET_ALL_CAMPAIGNS = gql`
  query GetAllCampaigns(
    $first: Int = 12
    $skip: Int = 0
    $orderBy: Campaign_orderBy = dateCreated
    $orderDirection: OrderDirection = desc
    $where: Campaign_filter
  ) {
    campaigns(
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
      where: $where
    ) {
      id
      campaignCID
      category
      content {
        title
      }
      amountSought
      amountRaised
      backers
      campaignRunning
      dateCreated
      endDate
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

export const GET_CAMPAIGNS_COUNT = gql`
  query GetCampaignsCount($where: Campaign_filter) {
    campaigns(where: $where) {
      id
    }
  }
`;

export const SEARCH_CAMPAIGNS = gql`
  query SearchCampaigns(
    $searchText: String!
    $first: Int = 12
    $skip: Int = 0
  ) {
    campaignSearch(text: $searchText, first: $first, skip: $skip) {
      id
      campaignCID
      category
      content {
        title
      }
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
