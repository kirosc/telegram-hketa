export interface BusRoute {
  route: string;
  orig_en: string;
  orig_tc: string;
  orig_sc: string;
  dest_en: string;
  dest_tc: string;
  dest_sc: string;
}

export interface BusRouteStop {
  route: string;
  seq: number;
  stop: string;
}

export interface BusStop {
  stop: string;
  name_en: string;
  name_tc: string;
  name_sc: string;
  lat: string;
  long: string;
}

export interface BusETA {
  co: string;
  route: string;
  dir: 'I' | 'O';
  seq: number;
  dest_en: string;
  dest_tc: string;
  dest_sc: string;
  eta_seq: number;
  eta: string | null; // ISO Time
  rmk_en: string;
  rmk_tc: string;
  rmk_sc: string;
  data_timestamp: string;
}
