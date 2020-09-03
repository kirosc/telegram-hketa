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

exports.getLRTETA = async (stationId) => {
  const GET_LRT_ETA = gql`
    query ETA($stationId: ID!) {
      LRT_platforms(stationId: $stationId) {
        id
        etas {
          train_length
          dest_ch
          time_ch
          route_no
        }
      }
    }
  `;

  const { data } = await client.query({
    query: GET_LRT_ETA,
    variables: { stationId }
  });

  return data.LRT_platforms;
};
