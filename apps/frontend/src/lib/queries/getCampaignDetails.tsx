"use client";

import client from '../graphQLClient';

export const getCampaignDetails = async (campaignID: string) => {
  const query = `
  query GetCampaignDetails($id: ID!) {
    campaign(id: $id) {
      id
      dateCreated
      projectDuration
      currentMilestone
      owner {
        id
      }
      contractAddress
      category
      amountSought
      amountRaised
      backers
      campaignRunning
      endDate
      content {
        media
        title
        details
      }
      owner {
        id
      }
      milestone {
        id
        milestoneCID
        details
        status
        periodToVote
        dateCreated
        votes {
          id
          voter
          project
          weight
          support
          timestamp
        }
        content {
          media
          title
          details
        }
      }
    donorsRecall {
      amount
      timestamp
      donor {
        id
      }
    }
    donations {
      amount
      timestamp
      id
      donor {
        id
      }
    }
  }
}
`;
    // Pass the variable in the request
    const variables = { id: campaignID };
    const data = await client.request(query, variables);
    return data;
};


