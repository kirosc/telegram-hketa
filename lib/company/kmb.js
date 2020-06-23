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

exports.getKMBETA = async (lang, route, bound, serviceType, seq, BSICode = '') => {
  const GET_KMB_ETA = gql`
    query ETA($lang: ID!, $route: ID!, $bound: ID!, $serviceType: ID!, $seq: ID!, $BSICode: ID!) {
      KMB_etas(lang: $lang, route: $route, bound: $bound, serviceType: $serviceType, seq: $seq, BSICode: $BSICode) {
        t
      }
    }
  `;

  const { data } = await client.query({
    query: GET_KMB_ETA,
    variables: { lang, route, bound, serviceType, seq, BSICode }
  });

  return data.KMB_etas;
};