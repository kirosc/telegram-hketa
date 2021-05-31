import { BusETA, BusRoute, BusRouteStop, BusStop } from '@interfaces/bus';
import { BRAVO_BUS_ENDPOINT } from '@src/constant';
import axios from 'axios';
import _ from 'lodash';
import { BOUND_MAPPING } from './common';

type Company = 'CTB' | 'NWFB';
type Direction = 'inbound' | 'outbound';

interface BravoBusResponse<T> {
  type: string;
  version: string;
  generated_timestamp: string;
  data: T;
}

export interface BravoBusRoute extends BusRoute {
  co: Company;
  data_timestamp: string;
}

export interface BravoBusRouteStop extends BusRouteStop {
  co: Company;
  dir: 'I' | 'O';
  data_timestamp: string;
}

export interface BravoBusStop extends BusStop {
  data_timestamp: string;
}

export interface BravoBusETA extends BusETA {
  stop: string;
  data_timestamp: string;
}

/**
 * Get the list of routes of a route
 */
export async function getBravoBusRoute(company: Company, route: string) {
  const res = await axios.get<BravoBusResponse<BravoBusRoute>>(
    `${BRAVO_BUS_ENDPOINT}/route/${company}/${route}`
  );

  return res.data.data;
}

/**
 * Get the list of stops of a route
 */
export async function getBravoBusRouteStop(
  company: Company,
  route: string,
  direction: Direction
) {
  const res = await axios.get<BravoBusResponse<BravoBusRouteStop[]>>(
    `${BRAVO_BUS_ENDPOINT}/route-stop/${company}/${route}/${direction}`
  );

  return res.data.data;
}

/**
 * Get the detail of a stop, e.g. name
 */
export async function getBravoBusStop(stopId: string) {
  const res = await axios.get<BravoBusResponse<BravoBusStop>>(
    `${BRAVO_BUS_ENDPOINT}/stop/${stopId}`
  );

  return res.data.data;
}

/**
 * Get the detail version stop list of a route, i.e. with name
 */
export async function getBravoBusRouteStopDetail(
  company: Company,
  route: string,
  direction: 'I' | 'O'
) {
  const routeStops = await getBravoBusRouteStop(
    company,
    route,
    BOUND_MAPPING[direction] as Direction
  );
  const nameJobs = routeStops.map((s) => getBravoBusStop(s.stop));
  const stops = await Promise.all(nameJobs);

  return routeStops.map((routeStop) => {
    return _.merge(routeStop, _.find(stops, { stop: routeStop.stop }));
  });
}

export async function getBravoBusETA(
  company: Company,
  stopId: string,
  route: string
) {
  const res = await axios.get<BravoBusResponse<BravoBusETA[]>>(
    `${BRAVO_BUS_ENDPOINT}/eta/${company}/${stopId}/${route}`
  );

  return res.data.data;
}

/**
 * Check if a route is circular, i.e. one bound only
 */
export async function isCircular(company: Company, route: string) {
  const stops = await getBravoBusRouteStop(company, route, 'inbound');
  return stops.length === 0;
}
