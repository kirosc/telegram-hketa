const constants = require('./constants');
const { readJSON } = require('./io');

// Build a keyboard when more than one company use the same route number
exports.companies = (companies, route) => {
    const companyNames = readJSON('companies');
    let keyboard = [];

    for (company of companies) {
        keyboard.push(
            {
                text: companyNames[company].tc_name,
                callback_data: `${constants.CHECK_CIRCULAR_ACTION},${company},${route}`
            }
        );
    }

    return keyboard;
};

// Build a keyboard when a route isn't circular
exports.direction = (company, route, routes) => {
    let keyboard = [];
    let callback = `${constants.STOPS_ACTION},${company},${route}`;

    switch (company) {
        case 'NLB':
            for (route of routes) {
                const { routeName_c, routeId } = route;
                keyboard.push([
                    { text: routeName_c, callback_data: `${callback},${routeId}` }
                ]);
            }

            break;
        case 'CTB':
        case 'NWFB':
            let { orig_tc, dest_tc } = routes;

            let inboundCallback = callback + ',inbound';
            let outboundCallback = callback + ',outbound';

            keyboard = [
                { text: orig_tc, callback_data: inboundCallback },
                { text: dest_tc, callback_data: outboundCallback }
            ];

            break;
        case 'KMB':
        case 'LWB':
            for (const route of routes) {
                let text = `${route.Origin_CHI} > ${route.Destination_CHI}`;
                let callback_data = callback + `,${route.Bound},${route.ServiceType.trim().replace(/^0+/, '')}`;

                if (route.Desc_CHI !== '循環線' && route.Desc_CHI) {
                    text += ' - ' + route.Desc_CHI;
                }

                keyboard.push([{ text, callback_data }]);
            }
            break;
        case 'MTR':
            for (const { id, description_zh } of routes) {
                let text = description_zh;
                let callback_data = callback + `,${id}`;
                keyboard.push([{ text, callback_data }]);
            }
            break;
    }

    return keyboard;
};

// Build a keyboard consists of list of stops
exports.stops = (action, company, route, names, stopIds, options) => {
    let keyboard = [], lastStop, callback;

    if (names.length % 2 !== 0)
        lastStop = names.pop();

    switch (company) {
        case 'NLB':
            callback = `${action},${company},${route},${options.routeId}`;
            break;
        case 'CTB':
        case 'NWFB':
            callback = `${action},${company},${route},${options.dir}`;
            break;
        case 'KMB':
        case 'LWB':
            callback = `${action},${company},${route},${options.bound || ''},${options.serviceType || ''}`;
            break;
        case 'MTR':
            callback = `${action},${company},${route}`;
            break;
    }

    for (let i = 0; i < names.length; i += 2) {
        const callback1 = callback + `,${stopIds[i]}`;
        const callback2 = callback + `,${stopIds[i + 1]}`;

        const button = [
            { text: names[i], callback_data: callback1 },
            { text: names[i + 1], callback_data: callback2 }
        ];
        keyboard.push(button);
    }

    if (lastStop) {
        const callback3 = `${callback},${stopIds.pop()}`;
        keyboard.push([{ text: lastStop, callback_data: callback3 }]);
    }

    return keyboard;
};

// Build a keyboard consists of metro lines
exports.lines = () => {
    const callback = constants.STATIONS_ACTION + ',';
    let keyboard = [];

    const lines = readJSON('mtr-lines');

    for (const [line, value] of Object.entries(lines)) {
        keyboard.push([{ text: value.tc, callback_data: callback + line + ',' }]);
    }

    return keyboard;
};

// Build a keyboard consists of stations of a metro line
exports.stations = line => {
    const callback = `${constants.MTR_ETA_ACTION},${line},`;
    let keyboard = [];

    const lines = readJSON('mtr-lines');

    let { stations } = lines[line];
    for (let i = 0; i < stations.length; i += 2) {
        const stationA = stations[i];

        if (i + 1 === stations.length) {
            keyboard.push([{ text: stationA.tc, callback_data: callback + stationA.code }]);
        } else {
            const stationB = stations[i + 1];
            const button = [
                { text: stationA.tc, callback_data: callback + stationA.code },
                { text: stationB.tc, callback_data: callback + stationB.code }
            ];

            keyboard.push(button);
        }
    }

    return keyboard;
};

// Build a keyboard for LRT zones
exports.zones = () => {
    const callback = constants.ZONES_ACTION + ',';
    let keyboard = [];

    const zones = readJSON('station-lrt');

    for (const zone of zones) {
        keyboard.push([{ text: zone.zone, callback_data: callback + zone.zone + ',' }]);
    }

    return keyboard;
};

// Build a keyboard consists of stations of LRT
exports.lrtStations = zoneName => {
    const callback = `${constants.LRT_ETA_ACTION},`;
    let keyboard = [];

    const zones = readJSON('station-lrt');

    const { stations } = zones.find(zone => zone.zone === zoneName);
    for (let i = 0; i < stations.length; i += 2) {
        const stationA = stations[i];

        if (i + 1 === stations.length) {
            keyboard.push([{ text: stationA.chi_name, callback_data: callback + stationA.station_id }]);
        } else {
            const stationB = stations[i + 1];
            const button = [
                { text: stationA.chi_name, callback_data: callback + stationA.station_id },
                { text: stationB.chi_name, callback_data: callback + stationB.station_id }
            ];

            keyboard.push(button);
        }
    }

    return keyboard;
};