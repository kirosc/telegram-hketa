import { LRTPlatform, LRTRoute, LRTSchedule } from '@interfaces/lrt';
import { LRT_ENDPOINT, SEPARATOR } from '@root/constant';
import axios from 'axios';

export async function getSchedule(station_id: number): Promise<LRTSchedule> {
  const res = await axios.get<LRTSchedule>(`${LRT_ENDPOINT}/getSchedule`, {
    params: { station_id },
  });

  return res.data;
}

export function getETAMessage(schedule: LRTSchedule): string {
  const message = `預計到站時間如下⌚\n${SEPARATOR}\n`;

  if (schedule.status === 0) {
    return '港鐵未能提供到站時間';
  }

  const platformETAs = schedule.platform_list.map(getPlatformMessage);

  return `${message}${platformETAs.join(`\n${SEPARATOR}\n`)}`;
}

export function getPlatformMessage(platform: LRTPlatform) {
  const { platform_id: id, route_list } = platform;
  const routeMessages = route_list?.map(getRouteMessage) ?? ['尾班車已過'];
  return `月台 - ${id}\n${routeMessages.join('\n')}`;
}

export function getRouteMessage(route: LRTRoute) {
  const { route_no, dest_ch, train_length, time_ch, stop } = route;

  if (!!stop) {
    return `${route_no} - 已停止服務`;
  }

  return `${route_no} - ${dest_ch} - ${train_length}卡 - ${
    time_ch === '-' ? '即將離開' : time_ch
  }`;
}
