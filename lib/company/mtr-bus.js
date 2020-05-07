require('dotenv').config();
const Boost = require('apollo-boost');
const fetch = require('node-fetch');
const ApolloClient = Boost.default;
const gql = require('graphql-tag');
const client = new ApolloClient({
  uri: process.env.HKETA_GRAPHQL,
  fetch
});

exports.getMTRShape = async (number) => {
  const GET_MTR_SHAPES = gql`
    query Route($number: ID!) {
      route(number: $number){
        shape
      }
    }
  `;

  const { data } = await client.query({
    query: GET_MTR_SHAPES,
    variables: {
      number
    }
  });

  return data;
};

exports.getMTRLines = async (number) => {
  const GET_MTR_LINES = gql`
    query Route($number: ID!) {
      route(number: $number){
        lines {
          id
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

exports.getMTRStops = async (id) => {
  const GET_MTR_STOPS = gql`
    query Stop($id: ID!) {
      line(id: $id){
        stops {
          ref_ID
          name_ch
        }
      }
    }
  `;

  const { data } = await client.query({
    query: GET_MTR_STOPS,
    variables: {
      id
    }
  });

  return data;
};

exports.getMTRETA = async (lang, stopID) => {
  const GET_MTR_ETA = gql`
    query ETA($lang: String!, $stopID: ID!) {
      etas(lang: $lang, stopID: $stopID) {
        arrivalTime
        departureTime
        delayed
        scheduled
      }
    }
  `;

  const { data } = await client.query({
    query: GET_MTR_ETA,
    variables: { lang, stopID }
  });

  return data.etas;
};