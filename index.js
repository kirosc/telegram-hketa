require('dotenv').config()
require('moment/locale/en-gb')
require('./data/routes.json')
require('./data/routes-NLB.json')
require('./data/companies.json')
const fs = require('fs')
const express = require('express')
const axios = require('axios')
const moment = require('moment')
const Telegraf = require('telegraf')
const Markup = require('telegraf/markup')
const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const Sentry = require('@sentry/node');

const CHECK_CIRCULAR_ACTION = '00'
const DIRECTION_ACTION = '01'
const STOPS_ACTION = '02'
const ETA_ACTION = '03'

const CHECK_CIRCULAR_ACTION_REGEX = new RegExp(`^${CHECK_CIRCULAR_ACTION},`)
const DIRECTION_ACTION_REGEX = new RegExp(`^${DIRECTION_ACTION},`)
const STOPS_ACTION_REGEX = new RegExp(`^${STOPS_ACTION},`)
const ETA_ACTION_REGEX = new RegExp(`^${ETA_ACTION},`)

const TG_TOKEN = process.env.TG_KEY
const SENTRY_TOKEN = process.env.SENTRY_KEY
const scene = new Telegraf.BaseScene('eta')

// Error tracking
Sentry.init({ dsn: `https://${SENTRY_TOKEN}@sentry.io/1873982` })
axios.interceptors.response.use(null, function (err) {
  Sentry.captureException(err);
  console.error(err)
})

// Take care of KMB & LWB response special encoding on some Chinese characters
const transformResponse = [res => {
  res = res.replace(/\ue473/g, '邨').replace(/\ue05e/g, '匯')
  return JSON.parse(res)
}]

scene.enter(ctx => ctx.reply('請輸入路線號碼🔢'))

scene.command('start', ctx => ctx.scene.enter('eta'))
scene.command('contribute', ctx => ctx.replyWithMarkdown(
  `Make this bot better!
[Open Source Project](https://github.com/kirosc/tg-hketa)`
))

scene.hears(/[A-Za-z0-9]*[0-9][A-Za-z0-9]*/g, async ctx => {
  const route = ctx.update.message.text.toUpperCase()
  const companies = isValidRoute(route)

  if (companies.length > 1) {
    await askCompany(ctx, companies, route)
  } else if (companies.length === 0) {
    ctx.reply('無此路線❌')
  } else {
    await checkCircular(ctx, companies[0], route)
  }
})

// Check if the route is circular
scene.action(CHECK_CIRCULAR_ACTION_REGEX, async ctx => {
  const [, company, route] = ctx.update.callback_query.data.split(',')
  await checkCircular(ctx, company, route)
})

// Ask for the route direction
scene.action(DIRECTION_ACTION_REGEX, async ctx => {
  const [, company, route] = ctx.update.callback_query.data.split(',')
  await askDirection(ctx, company, route)
})

// List all stops of a route with given direction
scene.action(STOPS_ACTION_REGEX, async ctx => {
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
scene.action(ETA_ACTION_REGEX, async ctx => {
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
})

scene.use(ctx => ctx.reply('無此路線❌'))

const bot = new Telegraf(TG_TOKEN)
const stage = new Stage([scene])

bot.use(session())
bot.use(stage.middleware())

bot.start(ctx => ctx.scene.enter('eta'))
bot.command('contribute', ctx => ctx.replyWithMarkdown(
  `Make this bot better!
[Open Source Project](https://github.com/kirosc/tg-hketa)`))
bot.on('message', ctx => {
  ctx.reply('輸入 /start 開始查詢')
})

const app = express()

app.use(bot.webhookCallback('/message'))

// Finally, start our server
app.listen(3000, function () {
  console.log('Telegram app listening on port 3000!')
})

async function askCompany(ctx, companies, route) {
  let companyNames = readJSON('companies')
  let keyboard = []

  for (company of companies) {
    keyboard.push(
      {
        text: companyNames[company].tc_name,
        callback_data: `${CHECK_CIRCULAR_ACTION},${company},${route}`
      }
    )
  }

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
  let keyboard = []
  let routes, callback

  switch (company) {
    case 'NLB':
      routes = await getRoute(company, route)
      callback = `${STOPS_ACTION},${company},${route}`

      for (route of routes) {
        const { routeName_c, routeId } = route
        keyboard.push([
          { text: routeName_c, callback_data: `${callback},${routeId}` }
        ])
      }

      break
    case 'CTB':
    case 'NWFB':
      let { orig_tc, dest_tc } = await getRoute(company, route)
      callback = `${STOPS_ACTION},${company},${route}`
      let orig = orig_tc
      let dest = dest_tc
      let inboundCallback = callback + ',inbound'
      let outboundCallback = callback + ',outbound'

      keyboard = [
        { text: orig, callback_data: inboundCallback },
        { text: dest, callback_data: outboundCallback }
      ]

      break
    case 'KMB':
    case 'LWB':
      routes = await getRoute(company, route)
      callback = `${STOPS_ACTION},${company},${route}`

      for (const route of routes) {
        let text = `${route.Origin_CHI} > ${route.Destination_CHI}`
        let callback_data = callback + `,${route.Bound},${route.ServiceType.trim()}`

        if (route.Desc_CHI !== '循環線' && route.Desc_CHI) {
          text += ' - ' + route.Desc_CHI
        }

        keyboard.push([{ text, callback_data }])
      }
  }

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
      keyboard = buildStopsKeyboard(ETA_ACTION, company, route, stopNames, stopIds, options)

      break
    case 'CTB':
    case 'NWFB':
      stopIds = await getRouteStop(company, route, options)
      stopNames = await getStopsName(stopIds)
      keyboard = buildStopsKeyboard(ETA_ACTION, company, route, stopNames, stopIds, options)

      break
    case 'KMB':
    case 'LWB':
      stopNames = await getRouteStop(company, route, options)
      // StopSequence is the stopID
      for (const idx of stopNames.keys())
        stopIds.push(idx)

      keyboard = buildStopsKeyboard(ETA_ACTION, company, route, stopNames, stopIds, options)

      break
  }

  ctx.reply(
    '請選擇巴士站🚏',
    Markup.inlineKeyboard(keyboard)
      .extra()
  )
}

// Get the JSON data
function readJSON(file) {
  try {
    const json = fs.readFileSync(`./data/${file}.json`, 'utf8')
    return JSON.parse(json)
  } catch (err) {
    console.log("File read failed:", err)
    return
  }
}

// Check if the route exists can return the company code
function isValidRoute(route) {
  if (/[A-Za-z0-9]*[0-9][A-Za-z0-9]*/.test(route)) {
    let routes = readJSON('routes')
    let companies = []
    for (company in routes) {
      if (routes[company].includes(route))
        companies.push(company)
    }
    return companies
  }
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

function buildStopsKeyboard(action, company, route, names, stopIds, options) {
  let keyboard = []
  let lastStop, callback

  if (names.length % 2 !== 0)
    lastStop = names.pop()

  switch (company) {
    case 'NLB':
      callback = `${action},${company},${route},${options.routeId}`
      break
    case 'CTB':
    case 'NWFB':
      callback = `${action},${company},${route},${options.dir}`
      break
    case 'KMB':
    case 'LWB':
      callback = `${action},${company},${route},${options.bound || ''},${options.serviceType || ''}`
      break
  }

  for (let i = 0; i < names.length; i += 2) {
    const callback1 = callback + `,${stopIds[i]}`
    const callback2 = callback + `,${stopIds[i + 1]}`

    const button = [
      { text: names[i], callback_data: callback1 },
      { text: names[i + 1], callback_data: callback2 }
    ]
    keyboard.push(button)
  }

  if (lastStop) {
    const callback3 = `${callback},${stopIds.pop()}`
    keyboard.push([{ text: lastStop, callback_data: callback3 }])
  }

  return keyboard
}