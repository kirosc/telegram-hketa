import { getTimeDiffinMins } from '@services/common';
import { NLB_ENDPOINT, SEPARATOR } from '@root/constant';
import axios from 'axios';
import _ from 'lodash';
import { DateTime } from 'luxon';

type NLBResponse<T, Data extends string> = {
  [P in Data]: Array<T>;
};

export interface NLBRoute {
  routeId: string;
  routeNo: string;
  routeName_c: string;
  routeName_s: string;
  routeName_e: string;
  overnightRoute: number; // 1 if overnight
  specialRoute: number; // 1 if special
}

export interface NLBStop {
  stopId: string;
  stopName_c: string;
  stopName_s: string;
  stopName_e: string;
  stopLocation_c: string;
  stopLocation_s: string;
  stopLocation_e: string;
  latitude: string;
  longitude: string;
  fare: string;
  fareHoliday: string;
  someDepartureObserveOnly: number;
}

export interface NLBETA {
  estimatedArrivalTime: string;
  routeVariantName: string;
  departed: number;
  noGPS: number;
  wheelChair: number;
  generateTime: string;
}

/**
 * Get the list of routes of a route
 */
export async function listNLBRoute() {
  const res = await axios.post<NLBResponse<NLBRoute, 'routes'>>(
    `${NLB_ENDPOINT}/route.php?action=list`
  );

  return res.data.routes;
}

export async function listNLBSubRoute(route: string) {
  const routes = await listNLBRoute();

  return routes.filter((r) => r.routeNo === route);
}

/**
 * Get the list of stops of a route
 */
export async function listNLBRouteStop(routeId: string) {
  const res = await axios.post<NLBResponse<NLBStop, 'stops'>>(
    `${NLB_ENDPOINT}/stop.php?action=list`,
    { routeId }
  );

  return res.data.stops;
}

export async function getNLBETA(
  routeId: string,
  stopId: string,
  language: string = 'zh'
) {
  const res = await axios.post<NLBResponse<NLBETA, 'estimatedArrivals'>>(
    `${NLB_ENDPOINT}/stop.php?action=estimatedArrivals`,
    {
      routeId,
      stopId,
      language,
    }
  );

  return res.data.estimatedArrivals;
}

export function getNLBETAMessage(etas: NLBETA[]) {
  const message = `預計到站時間如下⌚\n${SEPARATOR}\n`;

  const etasMessage = etas.map(
    ({ estimatedArrivalTime: eta, departed, wheelChair }, idx) => {
      const etaDt = DateTime.fromSQL(eta);
      const etaMins = getTimeDiffinMins(etaDt);
      const formattedTime = etaDt.toLocaleString(DateTime.TIME_24_SIMPLE);
      const additinoalIcon = wheelChair === 1 ? '♿️' : '';
      const schedule = departed === 1 ? '' : '未從總站開出';
      return `${
        idx + 1
      }. ${etaMins} 分鐘  (${formattedTime}) ${schedule} ${additinoalIcon}`;
    }
  );

  return `${message}${etasMessage.join('\n')}`;
}
