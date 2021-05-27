export interface LRTSchedule {
  platform_list: LRTPlatform[];
  status: 0 | 1;
  system_time: string;
}

export interface LRTPlatform {
  platform_id: number;
  route_list: LRTRoute[];
}

export interface LRTRoute {
  train_length: number;
  arrival_departure: 'A' | 'D';
  dest_en: string;
  dest_ch: string;
  time_en: string;
  time_ch: string;
  route_no: string;
  stop: number;
}
