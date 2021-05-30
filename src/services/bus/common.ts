import { readJSON } from '@services/io';
import _ from 'lodash';

export type BusCompanyCode = 'CTB' | 'NWFB' | 'KMB' | 'NLB' | 'MTR';
type Route = Record<string, string[]>;

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
