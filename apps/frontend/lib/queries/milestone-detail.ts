import { gql } from '@apollo/client';

export const GET_MILESTONE_DETAIL = gql`
  query GetMilestoneDetail($id: ID!) {
    milestone(id: $id) {
      id
      milestoneCID
      status
      amountToWithdraw
      amountWithdrawn
      periodToVote
      votesFor
      votesAgainst
      createdAt
      campaign {
        id
        title
        campaignCID
        category
        amountRaised
        owner {
          id
        }
        campaignRunning
      }
      votes {
        id
        voter
        weight
        support
        timestamp
      }
    }
  }
`;

export const GET_USER_DONATION = gql`
  query GetUserDonation($donor: String!, $campaign: String!) {
    donations(
      where: { donor: $donor, campaign: $campaign }
    ) {
      id
      amount
    }
  }
`;
