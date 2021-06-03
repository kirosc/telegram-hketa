import { BusETA } from '@interfaces/bus';
import { getTimeDiffinMins } from '@services/common';
import { readJSON } from '@services/io';
import { SEPARATOR } from '@root/constant';
import _ from 'lodash';
import { DateTime } from 'luxon';

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

const routes: Route = readJSON('routes');

/**
 *
 * @param route route number
 * @returns list of matched company code
 */
export function getRouteCompany(route: string): BusCompanyCode[] {
  const matched = _.pickBy(routes, (r) => r.includes(route));
  return _.keys(matched) as BusCompanyCode[];
}

export function getETAMessage(etas: BusETA[]) {
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
