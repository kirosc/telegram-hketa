import axios from 'axios';
import { MD5 } from 'crypto-js';
import { DateTime } from 'luxon';
import { MTR_BUS_ENDPOINT, SEPARATOR } from '@root/constant';
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
  name_en: string;
  name_ch: string;
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
  routeStatusRemarkContent: string | null;
  routeStatusRemarkFooterRemark: string;
  routeStatusRemarkTitle: string | null;
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

export function listMTRBusSubRoutes(route: string) {
  return routes.find((r) => r.route_number === route)!.lines;
}

export function listMTRBusStops(route: string, lineId: string) {
  return routes
    .find((r) => r.route_number === route)!
    .lines.find((l) => l.id.toString() === lineId)!.stops;
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

export function getMTRBusETAMessage(stopId: string, res: MTRBusETAResponse) {
  const stop = res.busStop.find((s) => s.busStopId === stopId);

  if (!stop) {
    return res.routeStatusRemarkTitle ?? '尾班車已過或未有到站時間提供';
  }

  const message = `預計到站時間如下⌚\n${SEPARATOR}\n`;
  const etasMessage = stop.bus.map(
    ({ arrivalTimeText, departureTimeText, isDelayed, isScheduled }, idx) => {
      const formattedTime = arrivalTimeText || departureTimeText;
      const delayed = isDelayed === '1' ? '延誤' : '';
      const scheduled = isScheduled === '1' ? '預定班次' : '';
      return `${idx + 1}. ${formattedTime} ${delayed} ${scheduled}`.trim();
    }
  );

  return `${message}${etasMessage.join('\n')}`;
}

/**
 * Generate a key for MTR Bus query
 */
function getMTRBusKey() {
  const str = 'mtrMobile_' + DateTime.now().toFormat('yyyyLLddHHmm');
  return MD5(str).toString();
}
