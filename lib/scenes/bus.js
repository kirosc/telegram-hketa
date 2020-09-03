const axios = require('axios');
const Telegraf = require('telegraf');
const Markup = require('telegraf/markup');

const analytics = require('../analytics');
const buildKeyboard = require('../keyboard');
const constants = require('../constants');
const { readJSON } = require('../io');
const { isValidRoute, getBusETA } = require('../helper');
const { getMTRLines, getMTRStops } = require('../company/mtr-bus');

const scene = new Telegraf.BaseScene(constants.BUS_SCENE_ID);

// Take care of KMB & LWB response special encoding on some Chinese characters
const transformResponse = [res => {
    res = res.replace(/\ue473/g, '邨').replace(/\ue05e/g, '匯');
    return JSON.parse(res);
}];

scene.command('mtr', ctx => ctx.scene.enter(constants.MTR_SCENE_ID));
scene.command('lrt', ctx => ctx.scene.enter(constants.LRT_SCENE_ID));

scene.enter(ctx => readRoute(ctx));

// If it is similar to route number format
scene.hears(/[A-Za-z0-9]*[0-9][A-Za-z0-9]*/g, ctx => readRoute(ctx));

// Check if the route is circular
scene.action(constants.CHECK_CIRCULAR_ACTION_REGEX, async ctx => {
    const [, company, route] = ctx.update.callback_query.data.split(',');
    await checkCircular(ctx, company, route);
});

// Ask for the route direction
scene.action(constants.DIRECTION_ACTION_REGEX, async ctx => {
    const [, company, route] = ctx.update.callback_query.data.split(',');
    await askDirection(ctx, company, route);
});

// List all stops of a route with given direction
scene.action(constants.STOPS_ACTION_REGEX, async ctx => {
    const [, company, route, option1, option2] = ctx.update.callback_query.data.split(',');

    switch (company) {
        case 'NLB':
            let routeId = option1;
            await askStops(ctx, company, route, { routeId });
            break;
        case 'CTB':
        case 'NWFB':
            let dir = option1;
            await askStops(ctx, company, route, { dir });
            break;
        case 'KMB':
        case 'LWB':
            let bound = option1;
            let serviceType = option2;
            await askStops(ctx, company, route, { bound, serviceType });
            break;
        case 'MTR':
            await askStops(ctx, company, route, { routeId: option1 });
            break;
    }
});

// Get the ETA
scene.action(constants.BUS_ETA_ACTION_REGEX, async ctx => {
    const [, company, route, option1, option2, option3] = ctx.update.callback_query.data.split(',');
    let etas;
    let str = '沒有到站時間預報⛔';

    switch (company) {
        case 'NLB':
            let routeId = option1;
            var stopId = option2;
            etas = await getBusETA(company, { routeId, stopId });
            if (etas.length === 0) break;

            str = '預計到站時間如下⌚';
            for (const [i, eta] of etas.entries()) {
                const { time, departed, noGPS } = eta;
                str += `\n${i + 1}. ${time} `;

                str += !departed ? '未從總站開出' : '已從總站開出';

                if (noGPS) {
                    str += ', 預計時間';
                }
            }

            break;
        case 'CTB':
        case 'NWFB':
            var stopId = option2;
            etas = await getBusETA(company, { route, stopId });
            if (etas.length === 0) break;

            str = '預計到站時間如下⌚';
            for (const [i, eta] of etas.entries()) {
                str += `\n${i + 1}. ${eta}`;
            }

            break;
        case 'KMB':
        case 'LWB':
            let bound = option1, serviceType = option2, stop_seq = option3;
            etas = await getBusETA(company, { route, bound, serviceType, stop_seq });

            if (etas[0].includes(':')) {
                str = '預計到站時間如下⌚';
                for (const [i, eta] of etas.entries()) {
                    str += `\n${i + 1}. ${eta}`;
                }
            } else {
                str = etas[0];
            }
            break;
        case 'MTR':
            const stopID = option1;
            etas = await getBusETA(company, { stopID });
            if (etas.length > 0) {
                str = '預計到站時間如下⌚';
                for (const [i, eta] of etas.entries()) {
                    str += `\n${i + 1}. ${eta}`;
                }
            }
            break;
    }

    ctx.reply(str);

    let params = {
        ec: 'bus',
        ea: 'company',
        el: company
    };
    analytics.send(ctx, params);
    params.ea = 'ETA';
    params.el = route;
    analytics.send(ctx, params);
});

scene.use(ctx => ctx.reply('無此路線❌'));

// Read a route from user and proceed to next step
async function readRoute(ctx) {
    let route;
    if (ctx.update.message.text) {
        route = ctx.update.message.text.toUpperCase();
    }
    const companies = isValidRoute(route);

    if (!companies) {
        ctx.reply('請輸入巴士路線號碼🔢');
    } else if (!companies.length) {
        ctx.reply('無此路線❌');
    } else if (companies.length > 1) {
        askCompany(ctx, companies, route);
    } else {
        await checkCircular(ctx, companies[0], route);
    }

    analytics.send(ctx, { ec: 'bus', ea: 'start' });
}

function askCompany(ctx, companies, route) {
    const keyboard = buildKeyboard.companies(companies, route);

    ctx.reply(
        '請選擇巴士公司🚍',
        Markup.inlineKeyboard(keyboard).extra()
    );
}

// Check if it is a circular route
async function checkCircular(ctx, company, route) {
    let res;
    switch (company) {
        case 'NLB':
            let routes = readJSON('routes-NLB');
            let circular = routes[route].length > 1;

            if (circular) {
                await askDirection(ctx, company, route);
            } else {
                let { routeId } = routes[route][0];
                await askStops(ctx, company, route, { routeId });
            }

            break;
        case 'CTB':
        case 'NWFB':
            let inbound = await getRouteStop(company, route, { dir: 'inbound' });
            inbound.length ? await askDirection(ctx, company, route) : await askStops(ctx, company, route, { dir: 'outbound' });

            break;
        case 'KMB':
        case 'LWB':
            res = await axios.get('http://search.kmb.hk/kmbwebsite/Function/FunctionRequest.ashx', {
                params: {
                    action: 'getroutebound',
                    route: route
                }
            });
            let bound = res.data.data;

            if (bound.length > 1) {
                await askDirection(ctx, company, route);
            } else if (bound.length === 1) {
                // Circular
                await askStops(ctx, company, route, {});
            } else {
                console.error(`Can't find information of route ${route}`);
                ctx.reply('無法找到此路線資料❌');
            }

            break;
        case 'MTR':
            res = await getMTRLines(route);

            if (res.MTR_route.lines.length > 1) {
                await askDirection(ctx, company, route, { lines: res.MTR_route.lines });
            } else {
                await askStops(ctx, company, route, { routeId: res.MTR_route.lines[0].id });
            }
            break;
    }
}

async function askDirection(ctx, company, route, options) {
    let keyboard, routes;

    switch (company) {
        case 'NLB':
        case 'KMB':
        case 'LWB':
            routes = await getRoute(company, route);
            break;
        case 'CTB':
        case 'NWFB':
            routes = { orig_tc, dest_tc } = await getRoute(company, route);
            break;
        case 'MTR':
            routes = options.lines;
            break;
    }

    keyboard = buildKeyboard.direction(company, route, routes);

    ctx.reply(
        '請選擇乘搭方向↔',
        Markup.inlineKeyboard(keyboard)
            .extra()
    );
}

async function askStops(ctx, company, route, options) {
    let stopNames = [], stopIds = [], keyboard;
    switch (company) {
        case 'NLB':
            [stopNames, stopIds] = await getRouteStop(company, route, options);
            break;
        case 'CTB':
        case 'NWFB':
            stopIds = await getRouteStop(company, route, options);
            stopNames = await getStopsName(stopIds);
            break;
        case 'KMB':
        case 'LWB':
            stopNames = await getRouteStop(company, route, options);
            // StopSequence is the stopID
            for (const idx of stopNames.keys())
                stopIds.push(idx);
            break;
        case 'MTR':
            const { routeId } = options;
            const { MTR_line } = await getMTRStops(routeId);
            for (const { name_ch, ref_ID } of MTR_line.stops) {
                stopNames.push(name_ch);
                stopIds.push(ref_ID);
            }
            break;
    }

    keyboard = buildKeyboard.stops(constants.BUS_ETA_ACTION, company, route, stopNames, stopIds, options);
    ctx.reply(
        '請選擇巴士站🚏',
        Markup.inlineKeyboard(keyboard)
            .extra()
    );
}

// Get the route information, like origin and destination
async function getRoute(company, route) {
    switch (company) {
        case 'NLB':
            let routes = readJSON('routes-NLB');
            return routes[route];
        case 'CTB':
        case 'NWFB':
            let url = 'https://rt.data.gov.hk/v1/transport/citybus-nwfb/route';
            let res = await axios.get(url + `/${company}/${route}`);
            return res.data.data;
        case 'KMB':
        case 'LWB':
            function getRouteBound(bound) {
                return axios.get('http://search.kmb.hk/kmbwebsite/Function/FunctionRequest.ashx', {
                    transformResponse,
                    params: {
                        action: 'getSpecialRoute',
                        route,
                        bound
                    }
                });
            }

            let [bound1, bound2] = await Promise.all([getRouteBound(1), getRouteBound(2)]);

            return bound1.data.data.routes.concat(bound2.data.data.routes);
    }

}

// Get the list of stops of a direction of route in ID
async function getRouteStop(company, route, options) {
    let url, res, stopNames = [];
    switch (company) {
        case 'NLB':
            url = 'https://rt.data.gov.hk/v1/transport/nlb/stop.php?action=list';
            res = await axios.post(url, { routeId: options.routeId });
            let stopIds = [];

            for (const { stopName_c, stopId } of res.data.stops) {
                stopNames.push(stopName_c);
                stopIds.push(stopId);
            }

            return [stopNames, stopIds];
        case 'CTB':
        case 'NWFB':
            url = 'https://rt.data.gov.hk/v1/transport/citybus-nwfb/route-stop';
            res = await axios.get(url + `/${company}/${route}/${options.dir}`);
            let stops = [];

            for (datum of res.data.data)
                stops.push(datum.stop);

            return stops;

        case 'KMB':
        case 'LWB':
            let { bound, serviceType } = options;
            url = 'http://search.kmb.hk/KMBWebSite/Function/FunctionRequest.ashx';
            res = await axios.get(url, {
                transformResponse,
                params: {
                    action: 'getstops',
                    route,
                    bound,
                    serviceType
                }
            });

            for (const stop of res.data.data.routeStops)
                stopNames.push(stop.CName);

            return stopNames;
    }
}

// Get the stop name of a list of stop ID
// For CTB and NWFB only
async function getStopsName(stopsID) {
    let url = 'https://rt.data.gov.hk/v1/transport/citybus-nwfb/stop';
    let tasks = [];
    let names = [];

    for (stopID of stopsID) {
        let task = axios.get(url + `/${stopID}`);
        tasks.push(task);
    }

    let res = await Promise.all(tasks);

    for (r of res) {
        names.push(r.data.data.name_tc);
    }

    return names;
}

module.exports = scene;
