const CHECK_CIRCULAR_ACTION = '00'
const DIRECTION_ACTION = '01'
const STOPS_ACTION = '02'
const ETA_ACTION = '03'

const CHECK_CIRCULAR_ACTION_REGEX = new RegExp(`^${CHECK_CIRCULAR_ACTION},`)
const DIRECTION_ACTION_REGEX = new RegExp(`^${DIRECTION_ACTION},`)
const STOPS_ACTION_REGEX = new RegExp(`^${STOPS_ACTION},`)
const ETA_ACTION_REGEX = new RegExp(`^${ETA_ACTION},`)

const ENV = process.env.NODE_ENV || 'devlopment'
const TG_TOKEN = process.env.TG_KEY
const SENTRY_TOKEN = process.env.SENTRY_KEY
const GA_TID = process.env.GA_TID

module.exports = Object.freeze({
    CHECK_CIRCULAR_ACTION,
    DIRECTION_ACTION,
    STOPS_ACTION,
    ETA_ACTION,
    CHECK_CIRCULAR_ACTION_REGEX,
    DIRECTION_ACTION_REGEX,
    STOPS_ACTION_REGEX,
    ETA_ACTION_REGEX,
    ENV,
    TG_TOKEN,
    SENTRY_TOKEN,
    GA_TID
})
