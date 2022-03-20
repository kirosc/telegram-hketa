export const SEPARATOR = '————————————————————';

// GOV
export const DATA_GOV_ENDPOINT = 'https://rt.data.gov.hk/v1/transport';
export const ETABUS_GOV_ENDPOINT = 'https://data.etabus.gov.hk';
export const ETAGMB_GOV_ENDPOINT = 'https://data.etagmb.gov.hk';

// MTR
export const MTR_ENDPOINT = `${DATA_GOV_ENDPOINT}/mtr`;
export const MTR_BUS_ENDPOINT =
  'https://mavmwfs1004.azurewebsites.net/MTRBus/BusService.svc';
export const MTR_DATA_ENDPOINT =
  'https://azumtrmbnba005v.azureedge.net/masterdata';

// LRT
export const LRT_ENDPOINT = `${MTR_ENDPOINT}/lrt`;

// KMB
export const KMB_ENDPOINT = `${ETABUS_GOV_ENDPOINT}/v1/transport/kmb`;

// Bravo Bus
export const BRAVO_BUS_ENDPOINT = `${DATA_GOV_ENDPOINT}/citybus-nwfb`;

// NLB
export const NLB_ENDPOINT = `${DATA_GOV_ENDPOINT}/nlb`;

// Green Minibus
export const GMB_ENDPOINT = `${ETAGMB_GOV_ENDPOINT}`;

// Tram
export const TRAM_ENDPOINT = 'https://www.hktramways.com/nextTram';

export enum BusCompany {
  KMB = 'KMB',
  CTB = 'CTB',
  NWFB = 'NWFB',
  NLB = 'NLB',
  MTR = 'MTR',
  GMB_HKI = 'GMB_HKI',
  GMB_KLN = 'GMB_KLN',
  GMB_NT = 'GMB_NT',
}

const PORT = process.env.PORT;
const ENV = process.env.NODE_ENV || 'devlopment';
const TG_TOKEN = process.env.TG_KEY;
const TG_DEV_TOKEN = process.env.TG_DEV_KEY;
const SENTRY_TOKEN = process.env.SENTRY_TOKEN;
const GA_TID = process.env.GA_TID;

export default Object.freeze({
  PORT,
  ENV,
  TG_TOKEN,
  TG_DEV_TOKEN,
  SENTRY_TOKEN,
  GA_TID,
});
