import { BusResponse } from '@interfaces/bus';
import { GMB_ENDPOINT } from '@root/constant';
import axios from 'axios';
import _ from 'lodash';
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
  remarks_tc: string;
  remarks_sc: string;
  remarks_en: string;
  timestamp: string;
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

export async function listGMBRouteStops(routeId: number, routeSeq: number) {
  const res = await axios.get<GMBResponse<GMBRouteStop[]>>(
    `${GMB_ENDPOINT}/route-stop/${routeId}/${routeSeq}`
  );
  return res.data.data;
}

export async function listGMBRouteStopETAs(routeId: number, stopId: number) {
  const res = await axios.get<GMBResponse<GMBETA[]>>(
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

export function buildGMBSubRouteKeyboard(routes: GMBRoute[]) {
  const listOfKeyboards = routes.map(
    ({ route_id, directions, description_tc }) => {
      const description = description_tc === '正常班次' ? '' : description_tc;

      return directions.map(({ route_seq, orig_tc, dest_tc }) => [
        `${route_id},${route_seq}`,
        `${orig_tc} > ${dest_tc} ${description}`,
      ]);
    }
  );

  return _.flatten(listOfKeyboards) as [string, string][];
}
