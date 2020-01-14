require('moment/locale/en-gb')

const axios = require('axios')
const moment = require('moment')

const { readJSON } = require('./io')

// Check if the route exists and return the company code
exports.isValidRoute = route => {
    if (/[A-Za-z0-9]*[0-9][A-Za-z0-9]*/.test(route)) {
        let routes = readJSON('routes')
        let companies = []
        
        for (company in routes) {
            if (routes[company].includes(route))
                companies.push(company)
        }
        return companies
    } 
    return null
}

exports.getBusETA = async (company, options) => {
    let url, res
    let etas = []

    switch (company) {
        case 'NLB':
            var { routeId, stopId } = options
            url = 'https://rt.data.gov.hk/v1/transport/nlb/stop.php?action=estimatedArrivals'
            res = await axios.post(url,
                {
                    routeId,
                    stopId,
                    language: "zh"
                })

            let { estimatedArrivals } = res.data

            if (estimatedArrivals.length === 0) {
                return []
            } else {
                for (const { estimatedArrivalTime, departed, noGPS } of estimatedArrivals) {
                    let time = estimatedArrivalTime.split(' ')[1]
                    const eta = {
                        time,
                        departed,
                        noGPS
                    }
                    etas.push(eta)
                }
            }

            break
        case 'CTB':
        case 'NWFB':
            var { route, stopId } = options
            url = 'https://rt.data.gov.hk/v1/transport/citybus-nwfb/eta'
            res = await axios.get(url + `/${company}/${stopId}/${route}`)
            let data = res.data.data

            for (const { eta } of data) {
                const etaHKTime = moment(eta).utcOffset(8).format('LTS')
                etas.push(etaHKTime)
            }

            break
        case 'KMB':
        case 'LWB':
            var { route, bound, serviceType, stop_seq } = options
            url = 'http://etav3.kmb.hk'
            res = await axios.get(url, {
                params: {
                    action: 'geteta',
                    lang: 'tc',
                    route,
                    bound,
                    stop_seq,
                    serviceType,
                }
            })

            if (!res.data.hasOwnProperty('response')) {
                // Empty ETA result
                return ['暫時未能提供到站時間預報\ud83d\ude47']
            }

            for (const eta of res.data.response)
                etas.push(eta.t)
    }
    return etas
}

exports.getStationName = (line, code, lang) => {
    const lines = readJSON('mtr-lines')
    let [name] = lines[line].stations.filter(station => {
        return code === station.code
    })

    return name[lang]
}

// Get the ETA of MTR
exports.getMTRETA = async (line, sta) => {
    let url = 'https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php'
    let res = await axios.get(url, {
        params: {
            line,
            sta,
            lang: 'tc'
        }
    })

    return res.data
}
