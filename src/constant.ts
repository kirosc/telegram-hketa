export const SEPARATOR = '————————————————————';

// DATA GOV
export const DATA_GOV_ENDPOINT = 'https://rt.data.gov.hk/v1/transport';

// MTR
export const MTR_ENDPOINT = `${DATA_GOV_ENDPOINT}/mtr`;

// LRT
export const LRT_ENDPOINT = `${MTR_ENDPOINT}/lrt`;

// KMB
export const KMB_ENDPOINT = 'https://data.etabus.gov.hk/v1/transport/kmb';

export enum BusCompany {
  KMB = 'KMB',
  CTB = 'CTB',
  NWFB = 'NWFB',
  NLB = 'NLB',
  MTR = 'MTR',
}
