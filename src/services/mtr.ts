import { DateTime } from 'luxon';

import { MTRRoute, MTRSchedule, MTRStation } from '@interfaces/mtr';
import { MTR_ENDPOINT, SEPARATOR } from '@root/constant';
import { readJSON } from '@services/io';

import cAxios from './axios';

interface Line {
  tc: string;
  en: string;
  stations: {
    code: string;
    tc: string;
    en: string;
  }[];
}

const lines: Record<string, Line> = readJSON('mtr-lines');

export const getLines = () => lines;

/**
 * Get MTR schedule
 *
 * @param line MTR line
 * @param sta Line station
 * @param lang Laungage
 * @returns
 */
export async function getSchedule(
  line: string,
  sta: string,
  lang: string = 'tc'
) {
  const res = await cAxios.get<MTRSchedule>(`${MTR_ENDPOINT}/getSchedule.php`, {
    params: {
      line,
      sta,
      lang,
    },
  });

  return [res.data, `${line}-${sta}`] as const;
}

/**
 * Get ETA of an MTR station
 *
 * @param schedule MTR schedule
 * @param slug line station pair, example `WRL-LOP`
 * @returns ETA message
 */
export function getETA(schedule: MTRSchedule, slug: string): string {
  const message = `預計到站時間如下⌚\n${SEPARATOR}\n`;

  if (schedule.status === 0) {
    return '港鐵未能提供到站時間';
  }

  if (!schedule.data) {
    throw new Error(`Cannot find data in schedule ${JSON.stringify(schedule)}`);
  }

  const stationETAs = getStationMessage(schedule.data[slug], slug);

  return `${message}${stationETAs}`;
}

export function getStationMessage(station: MTRStation, slug: string) {
  const { UP, DOWN } = station;
  const defaultMessage = ['尾班車已過'];

  const messages = [UP, DOWN].map((routes) => {
    if (!routes || routes.length === 0) {
      return defaultMessage;
    }

    return routes.map((r) => getRouteMessage(r, slug)).join('\n');
  });

  return messages.join(`\n${SEPARATOR}\n`);
}

export function getRouteMessage(route: MTRRoute, slug: string) {
  const { seq, ttnt, dest, time } = route;
  const [line] = slug.split('-');
  const stationName = getStationName(line, dest);
  const dt = DateTime.fromSQL(time);
  const formattedTime = dt.toLocaleString(DateTime.TIME_24_SIMPLE);
  return `${seq}. ${ttnt}分鐘 往${stationName} (${formattedTime})`;
}

export function getStationName(
  line: string,
  code: string,
  lang: 'tc' | 'en' = 'tc'
) {
  const [name] = lines[line].stations.filter(
    (station) => code === station.code
  );
  return name[lang];
}
