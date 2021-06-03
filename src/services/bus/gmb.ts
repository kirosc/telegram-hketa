import { BusResponse } from '@interfaces/bus';
import { GMB_ENDPOINT, SEPARATOR } from '@root/constant';
import axios from 'axios';
import _ from 'lodash';
import { DateTime } from 'luxon';
import { BusCompanyCode } from './common';

type Region = 'HKI' | 'KLN' | 'NT';

interface GMBResponse<T> extends BusResponse {
  data: T;
}

export interface GMBRoutes {
  routes: Record<Region, Array<string>>;
}

interface GMBHeadway {
  weekdays: boolean[];
  public_holiday: boolean;
  headway_seq: number;
  start_time: string;
  end_time: string;
  frequency: number;
  frequency_upper: number;
}

interface GMBDirection {
  route_seq: number;
  orig_tc: string;
  orig_sc: string;
  orig_en: string;
  dest_tc: string;
  dest_sc: string;
  dest_en: string;
  remarks_tc: string | null;
  remarks_sc: string | null;
  remarks_en: string | null;
  headways: GMBHeadway[];
  data_timestamp: string;
}

export interface GMBRoute {
  route_id: number;
  description_tc: string;
  description_sc: string;
  description_en: string;
  directions: GMBDirection[];
  data_timestamp: string;
}

export interface GMBRouteStop {
  stop_seq: number;
  stop_id: number;
  name_tc: string;
  name_sc: string;
  name_en: string;
}

export interface GMBETA {
  eta_seq: number;
  diff: number;
  remarks_tc: string | null;
  remarks_sc: string | null;
  remarks_en: string | null;
  timestamp: string;
}

interface GMBETAStopIdData {
  enabled: boolean; // Whether the ETA service is enabled for this route-stop combination
  route_seq: number;
  stop_seq: number;
  eta?: GMBETA[]; // eta ⊕ description
  description_tc?: string;
  description_sc?: string;
  description_en?: string;
}

interface GMBETAStopSequenceData {
  enabled: boolean;
  stop_id: number;
  eta?: GMBETA[]; // eta ⊕ description
  description_tc?: string;
  description_sc?: string;
  description_en?: string;
}

/**
 * Get the list of routes by region
 */
export async function listGMBRoutes() {
  const res = await axios.get<GMBResponse<GMBRoutes>>(`${GMB_ENDPOINT}/route`);
  return res.data.data.routes;
}

export async function retrieveGMBRoute(region: Region, route: string) {
  const res = await axios.get<GMBResponse<GMBRoute[]>>(
    `${GMB_ENDPOINT}/route/${region}/${route}`
  );
  return res.data.data;
}

export async function listGMBRouteStops(
  routeId: number | string,
  routeSeq: number | string
) {
  const res = await axios.get<GMBResponse<{ route_stops: GMBRouteStop[] }>>(
    `${GMB_ENDPOINT}/route-stop/${routeId}/${routeSeq}`
  );
  return res.data.data.route_stops;
}

export async function retrieveGMBRouteStopETAs(
  routeId: number | string,
  routeSeq: number | string,
  stopSeq: number | string
) {
  const res = await axios.get<GMBResponse<GMBETAStopSequenceData>>(
    `${GMB_ENDPOINT}/eta/route-stop/${routeId}/${routeSeq}/${stopSeq}`
  );
  return res.data.data;
}

/**
 * List all ETAs of a route stop
 *
 * A route may visit the same stop more than once.
 */
export async function listGMBRouteStopETAs(
  routeId: number | string,
  stopId: number | string
) {
  const res = await axios.get<GMBResponse<GMBETAStopIdData[]>>(
    `${GMB_ENDPOINT}/eta/route-stop/${routeId}/${stopId}`
  );
  return res.data.data;
}

export function getRegion(company: BusCompanyCode): Region {
  const [, region] = company.split('_');

  if (['HKI', 'KLN', 'NT'].includes(region)) {
    return region as Region;
  }

  throw new Error(`${company} is not in one of the GMB regions`);
}

/**
 * Build GMB telegram keyboards
 */
export function buildGMBSubRouteKeyboard(routes: GMBRoute[]) {
  const listOfKeyboards = routes.map(
    ({ route_id, directions, description_tc }) => {
      const description =
        description_tc === '正常班次' ? '' : `(${description_tc})`;

      return directions.map(({ route_seq, orig_tc, dest_tc }) => [
        `${route_id},${route_seq}`,
        `${orig_tc} > ${dest_tc} ${description}`,
      ]);
    }
  );

  return _.flatten(listOfKeyboards) as [string, string][];
}

export function getGMBETAMessage(etas: GMBETA[]) {
  if (etas.length === 0) {
    return '尾班車已過或未有到站時間提供';
  }

  const message = `預計到站時間如下⌚\n${SEPARATOR}\n`;
  const etasMessage = etas.map(({ eta_seq, diff, timestamp, remarks_tc }) => {
    const etaDt = DateTime.fromISO(timestamp);
    const formattedTime = etaDt.toLocaleString(DateTime.TIME_24_SIMPLE);
    const remark = remarks_tc ? `- ${remarks_tc}` : '';
    return `${eta_seq}. ${diff} 分鐘  (${formattedTime}) ${remark}`.trim();
  });

  return `${message}${etasMessage.join('\n')}`;
}
