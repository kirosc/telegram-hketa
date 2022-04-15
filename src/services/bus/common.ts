import _ from 'lodash';
import { DateTime } from 'luxon';
import moize from 'moize';

import { BusETA } from '@interfaces/bus';
import { SEPARATOR } from '@root/constant';
import { getTimeDiffinMins } from '@services/common';
import { readJSON } from '@services/io';

export type BusCompanyCode =
  | 'CTB'
  | 'NWFB'
  | 'KMB'
  | 'NLB'
  | 'MTR'
  | 'GMB_HKI'
  | 'GMB_KLN'
  | 'GMB_NT';
type Route = Record<string, string[]>;

export const BOUND_MAPPING = {
  I: 'inbound',
  O: 'outbound',
};

const getCompanyRoutes = moize.maxAge(1000 * 60 * 60 * 12)(() =>
  readJSON('routes')
);

/**
 *
 * @param route route number
 * @returns list of matched company code
 */
export function getRouteCompany(route: string): BusCompanyCode[] {
  const routes: Route = getCompanyRoutes();
  const matched = _.pickBy(routes, (r) => r.includes(route));
  return _.keys(matched) as BusCompanyCode[];
}

export function getETAMessage(bound: string, etas: BusETA[]) {
  if (etas.length === 0) {
    return '尾班車已過或未有到站時間提供';
  }

  const message = `預計到站時間如下⌚\n${SEPARATOR}\n`;

  const etasMessage = etas
    .filter((eta) => eta.dir === bound)
    .map(({ eta, eta_seq, dest_tc, rmk_tc }) => {
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
