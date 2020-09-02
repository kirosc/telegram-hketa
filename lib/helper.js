require('moment/locale/en-gb');

const axios = require('axios');
const moment = require('moment');

const { readJSON } = require('./io');
const { getMTRETA } = require('./company/mtr-bus');
const { getKMBETA } = require('./company/kmb');

// Check if the route exists and return the company code
exports.isValidRoute = route => {
    if (/[A-Za-z0-9]*[0-9][A-Za-z0-9]*/.test(route)) {
        let routes = readJSON('routes');
        let companies = [];

        for (company in routes) {
            if (routes[company].includes(route))
                companies.push(company);
        }
        return companies;
    }
    return null;
};

// Check if a LRT station name is valid
// @return station id
exports.isValidStation = name => {
    const zones = readJSON('station-lrt');
    for (const zone of zones) {
        const id = zone.stations.find(station => name === station.chi_name || name === station.eng_name );
        if (id) {
            return id
        }
    }
};

exports.getBusETA = async (company, options) => {
    let url, res;
    let etas = [];

    switch (company) {
        case 'NLB':
            var { routeId, stopId } = options;
            url = 'https://rt.data.gov.hk/v1/transport/nlb/stop.php?action=estimatedArrivals';
            res = await axios.post(url,
                {
                    routeId,
                    stopId,
                    language: "zh"
                });

            let { estimatedArrivals } = res.data;

            if (estimatedArrivals.length === 0) {
                return [];
            } else {
                for (const { estimatedArrivalTime, departed, noGPS } of estimatedArrivals) {
                    let time = estimatedArrivalTime.split(' ')[1];
                    const eta = {
                        time,
                        departed,
                        noGPS
                    };
                    etas.push(eta);
                }
            }

            break;
        case 'CTB':
        case 'NWFB':
            var { route, stopId } = options;
            url = 'https://rt.data.gov.hk/v1/transport/citybus-nwfb/eta';
            res = await axios.get(url + `/${company}/${stopId}/${route}`);
            let data = res.data.data;

            for (const { eta, rmk_tc } of data) {
                let etaHKTime;
                let time = moment(eta);
                if (time.isValid()) {
                    etaHKTime = moment(eta).utcOffset(8).format('LTS');
                } else {
                    etaHKTime = rmk_tc;
                }
                etas.push(etaHKTime);
            }

            break;
        case 'KMB':
        case 'LWB':
            var { route, bound, serviceType, stop_seq } = options;

            res = await getKMBETA('tc', route, bound, serviceType, stop_seq);
            if (!res || res.length === 0) {
                return ['暫時未能提供到站時間預報\ud83d\ude47'];
            }

            for (const eta of res)
                etas.push(eta.t);
            break;
        case 'MTR':
            const { stopID } = options;
            const rawETAS = await getMTRETA('zh', stopID);
            if (rawETAS.length > 0) {
                for (const eta of rawETAS) {
                    const { arrivalTime, departureTime, delayed, scheduled } = eta;
                    const time = arrivalTime === '' ? departureTime : arrivalTime;
                    let str = '';
                    str += `${time}`;
                    str += delayed ? ' (延誤)' : '';
                    str += scheduled ? ' (預定班次)' : '';
                    etas.push(str);
                }
            }
            break;
    }
    return etas;
};

exports.getStationName = (line, code, lang) => {
    const lines = readJSON('mtr-lines');
    let [name] = lines[line].stations.filter(station => {
        return code === station.code;
    });

    return name[lang];
};

// Get the ETA of MTR
exports.getMTRETA = async (line, sta) => {
    let url = 'https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php';
    let res = await axios.get(url, {
        params: {
            line,
            sta,
            lang: 'tc'
        }
    });

    return res.data;
};

exports.sendMessageToUsers = async (bot, users, msg) => {
    for (const { id } of users) {
        try {
            await bot.telegram.sendMessage(id, msg);
            console.log(`Success: ${id}`);
        } catch (error) {
            console.log(`Failed: ${id}`);
        }
    }
};
