"use client";

import client from '../graphQLClient';

export const getAllCampaigns = async () => {
  const query = `
  query GetAllCampaigns{
    campaigns(where: {campaignRunning: true}) {
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
    }
  }
`;

    const data = await client.request(query);
    return data;
};


