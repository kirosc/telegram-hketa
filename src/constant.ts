export const SEPARATOR = '————————————————————';

// DATA GOV
export const DATA_GOV_ENDPOINT = 'https://rt.data.gov.hk/v1/transport';

// MTR
export const MTR_ENDPOINT = `${DATA_GOV_ENDPOINT}/mtr`;

// LRT
export const LRT_ENDPOINT = `${MTR_ENDPOINT}/lrt`;

// KMB
export const KMB_ENDPOINT = 'https://data.etabus.gov.hk/v1/transport/kmb';

// Bravo Bus
export const BRAVO_BUS_ENDPOINT = `${DATA_GOV_ENDPOINT}/citybus-nwfb`;

export enum BusCompany {
  KMB = 'KMB',
  CTB = 'CTB',
  NWFB = 'NWFB',
  NLB = 'NLB',
  MTR = 'MTR',
}

const PORT = process.env.PORT;
const ENV = process.env.NODE_ENV || 'devlopment';
const TG_TOKEN = process.env.TG_KEY;
const TG_DEV_TOKEN = process.env.TG_DEV_KEY;
const SENTRY_TOKEN = process.env.SENTRY_KEY;
const GA_TID = process.env.GA_TID;

export default Object.freeze({
  PORT,
  ENV,
  TG_TOKEN,
  TG_DEV_TOKEN,
  SENTRY_TOKEN,
  GA_TID,
});
