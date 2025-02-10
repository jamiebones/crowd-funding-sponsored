"use client";

import client from '../graphQLClient';

export const getAllCampaignsMinimal = async () => {
  const query = `
  query GetAllCampaignsMinimal{
    campaigns(where: {campaignRunning: true}) {
      id
      category
    }
  }
`;
    const data = await client.request(query);
    return data;
};


