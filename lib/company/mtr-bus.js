require('dotenv').config();
const Boost = require('apollo-boost');
const fetch = require('node-fetch');
const ApolloClient = Boost.default;
const gql = require('graphql-tag');

const client = new ApolloClient({
  uri: process.env.HKETA_GRAPHQL,
  fetch
});

exports.getMTRLines = async (number) => {
  const GET_MTR_LINES = gql`
    query Route($number: ID!) {
      route(number: $number){
        lines {
          id,
          description_zh
        }
      }
    }
  `;

  const { data } = await client.query({
    query: GET_MTR_LINES,
    variables: {
      number
    }
  });

  return data;
};