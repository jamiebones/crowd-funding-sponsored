"use client";

import client from '../graphQLClient';

export const getCampaignPagination = async (lastID: string | undefined, limit: number) => {
  const query = `
  query GetCampaignPagination($lastID: String, $limit: Int) {
    campaigns(first: $limit, where: {id_gt: $lastID}) {
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
        title
      }
    }
  }
`;
  const variables = {
    lastID,
    limit
  };
  
  const data = await client.request(query, variables);
  return data;
};


