import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

const httpLink = new HttpLink({
    uri: process.env.NEXT_PUBLIC_SUBGRAPH_URL,
    headers: {
        authorization: process.env.NEXT_PUBLIC_BEARER_TOKEN
            ? `Bearer ${process.env.NEXT_PUBLIC_BEARER_TOKEN}`
            : '',
    },
});

export const apolloClient = new ApolloClient({
    link: httpLink,
    cache: new InMemoryCache(),
    defaultOptions: {
        watchQuery: {
            fetchPolicy: 'cache-and-network',
        },
    },
});
