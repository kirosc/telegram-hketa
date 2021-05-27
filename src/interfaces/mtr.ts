export interface MTRSchedule {
  status: 0 | 1;
  message: string;
  curr_time: string;
  sys_time?: string;
  isdelay?: 'Y' | 'N';
  data?: Record<string, MTRStation>;
  url?: string;
}

export interface MTRStation {
  curr_time: string;
  sys_time: string;
  UP?: MTRRoute[];
  DOWN?: MTRRoute[];
}

export interface MTRRoute {
  valid: string; // Dummy
  source: string; // Dummy
  plat: string;
  ttnt: string; // Time till departure
  time: string;
  dest: string; // Station code
  seq: string;
}
