import { BusResponse } from '@interfaces/bus';
import { GMB_ENDPOINT } from '@root/constant';
import axios from 'axios';

type Region = 'HKI' | 'KLN' | 'NT';

interface GMBResponse<T> extends BusResponse {
  data: T;
}

interface GMBRoutes {
  routes: Record<Region, Array<string>>;
}

/**
 * Get the list of routes by region
 */
export async function listGMBRoutes() {
  const res = await axios.get<GMBResponse<GMBRoutes>>(`${GMB_ENDPOINT}/route`);
  return res.data.data.routes;
}
