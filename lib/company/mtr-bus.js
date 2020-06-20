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


exports.getMTRShape = async (route) => {
  const GET_MTR_SHAPES = gql`
    query Route($route: ID!) {
      MTR_route(route: $route){
        shape
      }
    }
  `;

  const { data } = await client.query({
    query: GET_MTR_SHAPES,
    variables: {
      route
    }
  });

  return data;
};

exports.getMTRLines = async (route) => {
  const GET_MTR_LINES = gql`
    query Route($route: ID!) {
      MTR_route(route: $route){
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
      route
    }
  });

  return data;
};

exports.getMTRStops = async (id) => {
  const GET_MTR_STOPS = gql`
    query Stop($id: ID!) {
      MTR_line(id: $id){
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
      MTR_etas(lang: $lang, stopID: $stopID) {
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

  return data.MTR_etas;
};