"use client";

import client from '../graphQLClient';

export const getDonorDetails = async (donorID: string) => {
  const query = `
  query GetDonorDetails($id: ID!) {
    donor(id: $id) {
      id
      totalDonated
      totalWithdrawn
      donations{
        id
        amount
        timestamp
        donatingTo{
          id
          active
          projectDuration
          content{
            title
          }
          category
          contractAddress
          dateCreated
        }
      }
      withdrawals{
        id
        amount
        timestamp
        withdrawingFrom{
          id
          content{
            title
          }
          contractAddress
          dateCreated
        }
      }
    }
}
`;
    // Pass the variable in the request
    const variables = { id: donorID.toLowerCase() };
    console.log("variables",variables);
    const data = await client.request(query, variables);
    return data;
};


