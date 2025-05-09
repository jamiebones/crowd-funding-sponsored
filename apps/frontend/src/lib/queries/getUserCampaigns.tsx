"use client";
import client from '../graphQLClient';
import { gql } from "graphql-request";

export const getUserCampaigns = async (address: string) => {
    const query = gql`
        query CampaignsByOwner($ownerId: ID!) {
            campaignCreator(id: $ownerId) {
              id
              fundingGiven
              fundingWithdrawn
              createdCampaigns(first: 100) {
                  id
                  campaignCID
                  category
                  contractAddress
                  active
                  projectDuration
                  dateCreated
                  endDate
                  campaignRunning
                  amountSought
                  amountRaised
                  content{
                        media
                        title
                        details
                }
                 
              }
    }
}
`;
    // Pass the variable in the request
    const variables = { ownerId: address };
    const data = await client.request(query, variables);
    return data;
};


