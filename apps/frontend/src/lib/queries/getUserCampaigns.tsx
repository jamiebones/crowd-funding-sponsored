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
    try {
        // Pass the variable in the request
        const variables = { ownerId: address };
        const data = await client.request(query, variables);
        return data;
    } catch (error: any) {
        console.error('Error fetching user campaigns:', error);
        
        // Check if it's a subgraph deployment error
        if (error?.response?.errors?.some((err: any) => err.message.includes('deployment') && err.message.includes('does not exist'))) {
            throw new Error('Subgraph service is currently unavailable. Please try again later.');
        }
        
        // Throw original error for other cases
        throw error;
    }
};


