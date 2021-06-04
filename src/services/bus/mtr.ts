import axios from 'axios';
import { MD5 } from 'crypto-js';
import { DateTime } from 'luxon';
import { MTR_BUS_ENDPOINT } from '@root/constant';
import { readJSON } from '@services/io';

interface MTRBusRoute {
  route_number: string;
  route_ID: number;
  shape: 'I' | 'U';
  lines: MTRBusSubRoute[];
}

export interface MTRBusSubRoute {
  id: number;
  description_en: string;
  description_zh: string;
  stops: MTRBusStop[];
}

export interface MTRBusStop {
  neam_en: string;
  neam_zh: string;
  ref_ID: string;
}

export interface MTRBusETA {
  arrivalTimeInSecond: string;
  arrivalTimeText: string;
  busId: string;
  busLocation: {
    latitude: number;
    longitude: number;
  };
  busRemark: string | null;
  departureTimeInSecond: string;
  departureTimeText: string;
  isDelayed: '1' | '0';
  isScheduled: '1' | '0';
  lineRef: string;
}

export interface MTRBusETAResponse {
  appRefreshTimeInSecond: string;
  caseNumber: number;
  caseNumberDetail: string;
  footerRemarks: string;
  routeColour: string;
  routeName: string;
  routeStatus: string;
  routeStatusColour: string;
  routeStatusRemarkContent: string;
  routeStatusRemarkFooterRemark: string;
  routeStatusRemarkTitle: string;
  routeStatusTime: string;
  status: string;
  busStop: {
    bus: MTRBusETA[];
    busIcon: string | null;
    busStopId: string;
    busStopRemark: string | null;
    busStopStatus: string | null;
    busStopStatusRemarkContent: string | null;
    busStopStatusRemarkTitle: string | null;
    busStopStatusTime: string | null;
    isSuspended: '1' | '0';
  }[];
}

const routes: MTRBusRoute[] = readJSON('routes-mtr');

export async function listMTRSubRoute(route: string) {
  return routes.find((r) => r.route_number === route)!.lines;
}

export async function getMTRBusETA(route: string) {
  const res = await axios.post<MTRBusETAResponse>(
    `${MTR_BUS_ENDPOINT}/getBusStopsDetail`,
    {
      key: getMTRBusKey(),
      ver: 1,
      language: 'zh',
      routeName: route,
    }
  );

  return res.data;
}

/**
 * Generate a key for MTR Bus query
 */
export function getMTRBusKey() {
  const str = 'mtrMobile_' + DateTime.now().toFormat('yyyyLLddHHmm');
  return MD5(str).toString();
}
