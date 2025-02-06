"use client";
import client from '../graphQLClient';
import { gql } from "graphql-request";


export const searchCampaignsByContent = async (searchText: string) => {

    if (!searchText || typeof searchText !== "string") {
        throw new Error("searchText must be a non-empty string");
    }

    const formattedSearchText = searchText.includes(" ")
        ? `'${searchText}'`
        : searchText;
    const query = gql`
        query campaignSearch($text: String!) {
            campaignSearch(text: $text) {
                campaign{
                id
                projectDuration
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
            
            }
            }
    }
`;

    const variables = { text: formattedSearchText };
    const data = await client.request(query, variables);
    return data;
};

