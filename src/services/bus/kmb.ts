import {
  BusETA,
  BusResponse,
  BusRoute,
  BusRouteStop,
  BusStop,
} from '@interfaces/bus';
import { KMB_ENDPOINT } from '@src/constant';
import axios from 'axios';
import _ from 'lodash';
import { BOUND_MAPPING } from './common';

interface KMBResponse<T> extends BusResponse {
  data: T[];
}

export interface KMBRoute extends BusRoute {
  bound: 'I' | 'O';
  service_type: string;
}

export interface KMBRouteStop extends BusRouteStop {
  bound: 'I' | 'O';
  service_type: string;
}

export interface KMBETA extends BusETA {
  co: 'KMB';
  service_type: number;
}

/**
 * Get the list of routes of a route
 *
 * @param route Route, e.g. 11
 */
export async function getKMBRouteList(route: string) {
  const res = await axios.get<KMBResponse<KMBRoute>>(`${KMB_ENDPOINT}/route`);

  return res.data.data.filter((r) => r.route === route);
}

/**
 * Get the list of stops of a route
 *
 * @param route Route
 * @param bound inbound or outbound
 * @param service_type number
 */
export async function getKMBRouteStop(
  route: string,
  bound: 'I' | 'O',
  service_type: string
) {
  const res = await axios.get<KMBResponse<KMBRouteStop>>(
    `${KMB_ENDPOINT}/route-stop/${route}/${BOUND_MAPPING[bound]}/${service_type}`
  );

  return res.data.data.filter((r) => r.route === route);
}

/**
 * Get all the stops
 */
export async function getKMBStopList() {
  const res = await axios.get<KMBResponse<BusStop>>(`${KMB_ENDPOINT}/stop`);

  return res.data.data;
}

/**
 * Get the detail version stop list of a route
 *
 * @param route Route
 * @param bound inbound or outbound
 * @param service_type number
 */
export async function getKMBRouteStopDetail(
  route: string,
  bound: 'I' | 'O',
  service_type: string
) {
  const [routeStops, stopList] = await Promise.all([
    getKMBRouteStop(route, bound, service_type),
    getKMBStopList(),
  ]);

  return routeStops.map((routeStop) => {
    return _.merge(routeStop, _.find(stopList, { stop: routeStop.stop }));
  });
}

/**
 * Get the list of ETA
 *
 * @param route Route
 * @param service_type number
 * @param stopId stop id
 * @returns
 */
export async function getKMBETA(
  route: string,
  service_type: string,
  stopId: string
) {
  const res = await axios.get<KMBResponse<KMBETA>>(
    `${KMB_ENDPOINT}/eta/${stopId}/${route}/${service_type}`
  );

  return res.data.data;
}
