"use client";
import { GraphQLClient } from 'graphql-request';

const client = new GraphQLClient(process.env.NEXT_PUBLIC_GRAPH_ENDPOINT!); 

export default client;