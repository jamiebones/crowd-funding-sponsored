"use client";
import client from '../graphQLClient';
import { gql } from "graphql-request"

export const getCampaignsByCategory = async (category: number) => {
    const query = gql`
         query CampaignsByCategory($category: Int!) {
                    campaigns(where: { category: $category }, 
                    orderBy: dateCreated, orderDirection: desc){
                        content{
                            media
                            title
                            details
                        }
                        dateCreated
                        contractAddress
                        projectDuration
                        backers
                        category
                        amountSought
                        amountRaised
                        id
                        owner{
                          id
                        }
                    }
                
        }`
    const variables = { category: +category };
    const data = await client.request(query, variables);
    return data;
}