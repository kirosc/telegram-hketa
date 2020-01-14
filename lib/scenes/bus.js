require('moment/locale/en-gb')

const axios = require('axios')
const moment = require('moment')
const Telegraf = require('telegraf')
const Markup = require('telegraf/markup')

const analytics = require('../analytics')
const buildKeyboard = require('../keyboard')
const constants = require('../constants')
const { readJSON } = require('../io')
const { isValidRoute } = require('../helper')

const busScene = new Telegraf.BaseScene('bus')

// Take care of KMB & LWB response special encoding on some Chinese characters
const transformResponse = [res => {
    res = res.replace(/\ue473/g, '邨').replace(/\ue05e/g, '匯')
    return JSON.parse(res)
}]

busScene.enter(ctx => readRoute(ctx))

busScene.command('start', ctx => ctx.reply('請輸入巴士路線號碼🔢'))

busScene.command('contribute', ctx => ctx.replyWithMarkdown(
    `Make this bot better!
[Open Source Project](https://github.com/kirosc/tg-hketa)`
))

// If it is similar to route number format
busScene.hears(/[A-Za-z0-9]*[0-9][A-Za-z0-9]*/g, ctx => readRoute(ctx))

// Check if the route is circular
busScene.action(constants.CHECK_CIRCULAR_ACTION_REGEX, async ctx => {
    const [, company, route] = ctx.update.callback_query.data.split(',')
    await checkCircular(ctx, company, route)
})

// Ask for the route direction
busScene.action(constants.DIRECTION_ACTION_REGEX, async ctx => {
    const [, company, route] = ctx.update.callback_query.data.split(',')
    await askDirection(ctx, company, route)
})

// List all stops of a route with given direction
busScene.action(constants.STOPS_ACTION_REGEX, async ctx => {
    const [, company, route, option1, option2] = ctx.update.callback_query.data.split(',')

    switch (company) {
        case 'NLB':
            let routeId = option1
            await askStops(ctx, company, route, { routeId })
            break
        case 'CTB':
        case 'NWFB':
            let dir = option1
            await askStops(ctx, company, route, { dir })
            break
        case 'KMB':
        case 'LWB':
            let bound = option1
            let serviceType = option2
            await askStops(ctx, company, route, { bound, serviceType })
            break
    }
})

// Get the ETA
busScene.action(constants.ETA_ACTION_REGEX, async ctx => {
    const [, company, route, option1, option2, option3] = ctx.update.callback_query.data.split(',')
    let etas
    let str = '沒有到站時間預報⛔'

    switch (company) {
        case 'NLB':
            let routeId = option1
            var stopId = option2
            etas = await getETA(company, { routeId, stopId })
            if (etas.length === 0) break

            str = '預計到站時間如下⌚'
            for (const [i, eta] of etas.entries()) {
                const { time, departed, noGPS } = eta
                str += `\n${i + 1}. ${time} `

                str += !departed ? '未從總站開出' : '已從總站開出'

                if (noGPS) {
                    str += ', 預計時間'
                }
            }

            break
        case 'CTB':
        case 'NWFB':
            var stopId = option2
            etas = await getETA(company, { route, stopId })
            if (etas.length === 0) break

            str = '預計到站時間如下⌚'
            for (const [i, eta] of etas.entries()) {
                str += `\n${i + 1}. ${eta}`
            }

            break
        case 'KMB':
        case 'LWB':
            let bound = option1, serviceType = option2, stop_seq = option3
            etas = await getETA(company, { route, bound, serviceType, stop_seq })

            if (etas[0].includes(':')) {
                str = '預計到站時間如下⌚'
                for (const [i, eta] of etas.entries()) {
                    str += `\n${i + 1}. ${eta}`
                }
            } else {
                str = etas[0]
            }
    }

    ctx.reply(str)

    let params = {
        ec: 'bus',
        ea: 'company',
        el: company
    }
    analytics.send(ctx, params)
    params.ea = 'ETA'
    params.el = route
    analytics.send(ctx, params)
})

busScene.use(ctx => ctx.reply('無此路線❌'))

async function readRoute(ctx) {
    const route = ctx.update.message.text.toUpperCase()
    const companies = isValidRoute(route)

    if (!companies) {
        ctx.reply('請輸入巴士路線號碼🔢')
    } else if (!companies.length) {
        ctx.reply('無此路線❌')
    } else if (companies.length > 1) {
        askCompany(ctx, companies, route)
    } else {
        await checkCircular(ctx, companies[0], route)
    }

    analytics.send(ctx, { ec: 'bus', ea: 'start' })
}

function askCompany(ctx, companies, route) {
    const keyboard = buildKeyboard.companies(companies, route)

    ctx.reply(
        '請選擇巴士公司🚍',
        Markup.inlineKeyboard(keyboard).extra()
    )
}

// Check if it is a circular route
async function checkCircular(ctx, company, route) {
    switch (company) {
        case 'NLB':
            let routes = readJSON('routes-NLB')
            let circular = routes[route].length > 1

            if (circular) {
                await askDirection(ctx, company, route)
            } else {
                let { routeId } = routes[route][0]

                await askStops(ctx, company, route, { routeId })
            }

            break
        case 'CTB':
        case 'NWFB':
            let inbound = await getRouteStop(company, route, { dir: 'inbound' })
            inbound.length ? await askDirection(ctx, company, route) : await askStops(ctx, company, route, { dir: 'outbound' })

            break
        case 'KMB':
        case 'LWB':
            let res = await axios.get('http://search.kmb.hk/kmbwebsite/Function/FunctionRequest.ashx', {
                params: {
                    action: 'getroutebound',
                    route: route
                }
            })
            let bound = res.data.data

            if (bound.length > 1) {
                await askDirection(ctx, company, route)
            } else if (bound.length === 1) {
                // Circular
                await askStops(ctx, company, route, {})
            } else {
                console.error(`Can't find information of route ${route}`)
                ctx.reply('無法找到此路線資料❌')
            }

            break
    }
}

async function askDirection(ctx, company, route) {
    let keyboard, routes

    switch (company) {
        case 'NLB':
        case 'KMB':
        case 'LWB':
            routes = await getRoute(company, route)

            break
        case 'CTB':
        case 'NWFB':
            routes = { orig_tc, dest_tc } = await getRoute(company, route)
    }

    keyboard = buildKeyboard.direction(company, route, routes)

    ctx.reply(
        '請選擇乘搭方向↔',
        Markup.inlineKeyboard(keyboard)
            .extra()
    )
}

async function askStops(ctx, company, route, options) {
    let stopNames, stopIds = [], keyboard
    switch (company) {
        case 'NLB':
            [stopNames, stopIds] = await getRouteStop(company, route, options)
            keyboard = buildKeyboard.stops(constants.ETA_ACTION, company, route, stopNames, stopIds, options)

            break
        case 'CTB':
        case 'NWFB':
            stopIds = await getRouteStop(company, route, options)
            stopNames = await getStopsName(stopIds)
            keyboard = buildKeyboard.stops(constants.ETA_ACTION, company, route, stopNames, stopIds, options)

            break
        case 'KMB':
        case 'LWB':
            stopNames = await getRouteStop(company, route, options)
            // StopSequence is the stopID
            for (const idx of stopNames.keys())
                stopIds.push(idx)

            keyboard = buildKeyboard.stops(constants.ETA_ACTION, company, route, stopNames, stopIds, options)

            break
    }

    ctx.reply(
        '請選擇巴士站🚏',
        Markup.inlineKeyboard(keyboard)
            .extra()
    )
}

// Get the route information, like origin and destination
async function getRoute(company, route) {
    switch (company) {
        case 'NLB':
            let routes = readJSON('routes-NLB')
            return routes[route]
        case 'CTB':
        case 'NWFB':
            let url = 'https://rt.data.gov.hk/v1/transport/citybus-nwfb/route'
            let res = await axios.get(url + `/${company}/${route}`)
            return res.data.data
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
                })
            }

            let [bound1, bound2] = await Promise.all([getRouteBound(1), getRouteBound(2)])

            return bound1.data.data.routes.concat(bound2.data.data.routes)
    }

}

// Get the list of stops of a direction of route in ID
async function getRouteStop(company, route, options) {
    let url, res, stopNames = []
    switch (company) {
        case 'NLB':
            url = 'https://rt.data.gov.hk/v1/transport/nlb/stop.php?action=list'
            res = await axios.post(url, { routeId: options.routeId })
            let stopIds = []

            for (const { stopName_c, stopId } of res.data.stops) {
                stopNames.push(stopName_c)
                stopIds.push(stopId)
            }

            return [stopNames, stopIds]
        case 'CTB':
        case 'NWFB':
            url = 'https://rt.data.gov.hk/v1/transport/citybus-nwfb/route-stop'
            res = await axios.get(url + `/${company}/${route}/${options.dir}`)
            let stops = []

            for (datum of res.data.data)
                stops.push(datum.stop)

            return stops

        case 'KMB':
        case 'LWB':
            let { bound, serviceType } = options
            url = 'http://search.kmb.hk/KMBWebSite/Function/FunctionRequest.ashx'
            res = await axios.get(url, {
                transformResponse,
                params: {
                    action: 'getstops',
                    route,
                    bound,
                    serviceType
                }
            })

            for (const stop of res.data.data.routeStops)
                stopNames.push(stop.CName)

            return stopNames
    }
}

// Get the stop name of a list of stop ID
// For CTB and NWFB only
async function getStopsName(stopsID) {
    let url = 'https://rt.data.gov.hk/v1/transport/citybus-nwfb/stop'
    let tasks = []
    let names = []

    for (stopID of stopsID) {
        let task = axios.get(url + `/${stopID}`)
        tasks.push(task)
    }

    let res = await Promise.all(tasks)

    for (r of res) {
        names.push(r.data.data.name_tc)
    }

    return names
}

async function getETA(company, options) {
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

module.exports = busScene