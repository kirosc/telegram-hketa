import axios from 'axios';
import { MD5 } from 'crypto-js';
import { DateTime } from 'luxon';
import { MTR_BUS_ENDPOINT, MTR_DATA_ENDPOINT, SEPARATOR } from '@root/constant';
import { readJSON } from '@services/io';
import Knex from 'knex';
import _ from 'lodash';
import fs from 'fs';
import path from 'path';

interface MTRBusRoute {
  route_number: string;
  route_ID: number;
  shape: 'I' | 'U' | 'H' | 'O';
  lines: MTRBusSubRoute[];
}

export interface MTRBusSubRoute {
  id: string;
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

export function listMTRBusSubRoutes(route: string): MTRBusSubRoute[] {
  return routes.filter((r) => r.route_number === route).flatMap((r) => r.lines);
}

export function listMTRBusStops(route: string, lineId: string): MTRBusStop[] {
  // TODO: refactor lines to a single object
  const line = routes.find(
    ({ route_number, lines }) =>
      route_number === route && lines[0].id === lineId
  )!.lines[0];
  return line.stops;
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

// TODO: deprecate
async function getRouteFromDB() {
  const knex = Knex({
    client: 'sqlite3',
    connection: {
      filename: path.resolve(__dirname, '../../../E_Bus.db'),
    },
  });
  const routes: any = [];

  const busRoute = await knex
    .select('route_ID', 'route_number', 'description_en', 'description_zh')
    .table('busRoute');
  const busRouteLine = await knex
    .select('routeLine_ID', 'route_ID', 'from_stop', 'shape')
    .table('busRouteLine');
  const busStop = await knex
    .select(
      'routeLine_ID',
      'name_en',
      'name_ch',
      'remark_en',
      'remark_ch',
      'ref_ID'
    )
    .orderBy('sort_order', 'asc')
    .table('busStop');

  for (const route of busRoute) {
    // Covert to route based index object
    let { route_number, route_ID } = route;
    let newRoute: any = { route_number, route_ID, shape: '', lines: [] };

    const lines = _.filter(busRouteLine, (line) => line.route_ID === route_ID);
    newRoute.shape = lines[0].shape;

    // Parsing directions of routes
    for (const { shape, routeLine_ID, from_stop } of lines) {
      let { description_en, description_zh } = route;
      // Prettify bidirectional route
      if (shape === 'H') {
        let description_en_list = description_en.split(' ←→ ');
        let description_zh_list = description_zh.split(' ←→ ');

        if (!_.startsWith(description_zh_list, from_stop)) {
          description_zh_list = _.reverse(description_zh_list);
          description_en_list = _.reverse(description_en_list);
        }
        description_en =
          description_en_list[0] + ' to ' + description_en_list[1];
        description_zh =
          description_zh_list[0] + ' 往 ' + description_zh_list[1];
      }

      // Appending stop to line
      const stops = _.filter(
        busStop,
        (stop) => stop.routeLine_ID === routeLine_ID
      );
      for (let stop of stops) {
        const { remark_en, remark_ch } = stop;
        if (remark_en !== '') {
          stop.name_en += remark_en;
          stop.name_ch += remark_ch;
        }
        delete stop.routeLine_ID;
        delete stop.remark_en;
        delete stop.remark_ch;
      }
      newRoute.lines.push({
        id: routeLine_ID,
        description_en,
        description_zh,
        stops,
      });
    }
    routes.push(newRoute);
  }

  fs.writeFileSync(
    path.resolve(__dirname, '../../../data/routes-mtr.json'),
    JSON.stringify(routes),
    'utf-8'
  );
}

export async function getRoutes() {
  const mtrData = await axios.get<any>(
    `${MTR_DATA_ENDPOINT}/MTRMasterData.json`
  );

  const routes: any = [];

  for (const data of mtrData.data.Routes) {
    const description_en = data.OrigEN + ' to ' + data.DestEn;
    const description_zh = data.OrigTC + ' 往 ' + data.DestTC;
    const route: MTRBusRoute = {
      route_number: data.RouteNo,
      route_ID: data.RouteId, // TODO: deprecate
      shape: data.Direction,
      lines: [
        {
          id: `${data.RouteId}-${data.Direction}`,
          description_en,
          description_zh,
          stops: data.Stops.map((stop) => ({
            name_en: stop.NameEN,
            name_ch: stop.NameTC,
            ref_ID: stop.StopId,
          })),
        },
      ],
    };
    routes.push(route);
  }

  fs.writeFileSync(
    path.resolve(__dirname, '../../../data/routes-mtr.json'),
    JSON.stringify(routes),
    'utf-8'
  );
}
