require('dotenv').config();
const Boost = require('apollo-boost');
const fetch = require('node-fetch');
const ApolloClient = Boost.default;
const gql = require('graphql-tag');
const { HKETA_GRAPHQL } = require('../constants');
const client = new ApolloClient({
  uri: HKETA_GRAPHQL,
  fetch,
  onError: ({ networkError, graphQLErrors }) => {
    console.log(graphQLErrors);
    console.log(networkError);
  }
});

exports.getKMBETA = async (lang, route, bound, serviceType, seq) => {
  const GET_KMB_ETA = gql`
    query ETA($lang: ID!, $route: ID!, $bound: ID!, $serviceType: ID!, $seq: ID!) {
      KMB_etas(lang: $lang, route: $route, bound: $bound, serviceType: $serviceType, seq: $seq) {
        t
      }
    }
  `;

  const { data } = await client.query({
    query: GET_KMB_ETA,
    variables: { lang, route, bound, serviceType, seq }
  });

  return data.KMB_etas;
};