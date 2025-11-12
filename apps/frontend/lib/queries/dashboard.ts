import { gql } from '@apollo/client';

// Get user's created campaigns
export const GET_USER_CAMPAIGNS = gql`
  query GetUserCampaigns($owner: String!) {
    campaigns(
      where: { owner: $owner }
      orderBy: dateCreated
      orderDirection: desc
    ) {
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
      campaignRunning
      dateCreated
      endDate
      owner {
        id
      }
    }
  }
`;

// Get user's donations
export const GET_USER_DONATIONS = gql`
  query GetUserDonations($donor: String!) {
    donations(
      where: { donor: $donor }
      orderBy: timestamp
      orderDirection: desc
    ) {
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
        category
        campaignRunning
      }
      donor {
        id
      }
    }
  }
`;

// Get user's withdrawals
export const GET_USER_WITHDRAWALS = gql`
  query GetUserWithdrawals($donor: String!) {
    donorWithdrawals(
      where: { donor: $donor }
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      amount
      timestamp
      withdrawingFrom {
        id
        contractAddress
        campaignCID
        content {
          title
        }
        category
        campaignRunning
      }
      donor {
        id
      }
    }
  }
`;

// Get user's votes
export const GET_USER_VOTES = gql`
  query GetUserVotes($voter: String!) {
    votes(
      where: { voter: $voter }
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      support
      weight
      timestamp
      milestone {
        id
        milestoneCID
        status
        periodToVote
        campaign {
          id
          content {
            title
          }
          category
        }
      }
    }
  }
`;

// Get user's donor profile (for token balance)
export const GET_USER_DONOR_PROFILE = gql`
  query GetUserDonorProfile($id: String!) {
    donor(id: $id) {
      id
      totalDonated
      totalWithdrawn
      donations {
        id
        amount
      }
      withdrawals {
        id
        amount
      }
    }
  }
`;

// Get user's campaign creator profile
export const GET_USER_CREATOR_PROFILE = gql`
  query GetUserCreatorProfile($id: String!) {
    campaignCreator(id: $id) {
      id
      totalCampaigns
      fundingGiven
      createdCampaigns {
        id
        amountRaised
        campaignRunning
      }
    }
  }
`;

// Combined dashboard stats
export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats($address: String!) {
    donor(id: $address) {
      id
      totalDonated
      totalWithdrawn
    }
    campaignCreator(id: $address) {
      id
      totalCampaigns
      fundingGiven
    }
    campaigns(where: { owner: $address }) {
      id
    }
    donations(where: { donor: $address }) {
      id
    }
    votes(where: { voter: $address }) {
      id
    }
  }
`;
