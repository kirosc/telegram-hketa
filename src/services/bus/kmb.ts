import { getTimeDiffinMins } from '@services/common';
import { KMB_ENDPOINT, SEPARATOR } from '@src/constant';
import axios from 'axios';
import _ from 'lodash';
import { DateTime, Interval } from 'luxon';

interface KMBResponse<T> {
  type: string;
  version: string;
  generated_timestamp: string;
  data: T[];
}

export interface KMBRoute {
  route: string;
  bound: 'I' | 'O';
  service_type: string;
  orig_en: string;
  orig_tc: string;
  orig_sc: string;
  dest_en: string;
  dest_tc: string;
  dest_sc: string;
}

export interface KMBRouteStop {
  route: string;
  bound: 'I' | 'O';
  service_type: string;
  seq: string;
  stop: string;
}

export interface KMBStop {
  stop: string;
  name_en: string;
  name_tc: string;
  name_sc: string;
  lat: string;
  long: string;
}

export interface KMBETA {
  co: 'KMB';
  route: string;
  dir: 'I' | 'O';
  service_type: number;
  seq: number;
  dest_en: string;
  dest_tc: string;
  dest_sc: string;
  eta_seq: number;
  eta: string | null; // ISO Time
  rmk_en: string;
  rmk_tc: string;
  rmk_sc: string;
  data_timestamp: string; // ISO Time
}

const BOUND_MAPPING = {
  I: 'inbound',
  O: 'outbound',
};

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
  const res = await axios.get<KMBResponse<KMBStop>>(`${KMB_ENDPOINT}/stop`);

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

export function getKMBETAMessage(etas: KMBETA[]) {
  const message = `預計到站時間如下⌚\n${SEPARATOR}\n`;

  const etasMessage = etas.map(({ eta, eta_seq, dest_tc, rmk_tc }) => {
    if (!eta) {
      return rmk_tc;
    }

    const etaDt = DateTime.fromISO(eta);
    const etaMins = getTimeDiffinMins(etaDt);
    const formattedTime = etaDt.toLocaleString(DateTime.TIME_24_SIMPLE);
    const remark = rmk_tc ? `- ${rmk_tc}` : '';
    return `${eta_seq}. ${etaMins} 分鐘  (${formattedTime}) - 往 ${dest_tc} ${remark}`;
  });

  return `${message}${etasMessage.join('\n')}`;
}
