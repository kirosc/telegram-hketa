require('dotenv').config()
require('./data/routes.json')
require('./data/routes-NLB.json')
require('./data/companies.json')
const fs = require('fs')
const express = require('express')
const axios = require('axios')
const Telegraf = require('telegraf')
const Markup = require('telegraf/markup')
const session = require('telegraf/session')
const Stage = require('telegraf/stage')

const CHECK_CIRCULAR_ACTION = '00'
const DIRECTION_ACTION = '01'
const STOPS_ACTION = '02'
const ETA_ACTION = '03'

const CHECK_CIRCULAR_ACTION_REGEX = new RegExp(`^${CHECK_CIRCULAR_ACTION},`)
const DIRECTION_ACTION_REGEX = new RegExp(`^${DIRECTION_ACTION},`)
const STOPS_ACTION_REGEX = new RegExp(`^${STOPS_ACTION},`)
const ETA_ACTION_REGEX = new RegExp(`^${ETA_ACTION},`)

const TOKEN = process.env.API_KEY
const scene = new Telegraf.BaseScene('eta');

scene.enter(ctx => ctx.reply('請輸入路線號碼🔢'));

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
});

// Ask for the route direction
scene.action(DIRECTION_ACTION_REGEX, async ctx => {
  const [, company, route] = ctx.update.callback_query.data.split(',')
  await askDirection(ctx, company, route)
});

// List all stops of a route with given direction
scene.action(STOPS_ACTION_REGEX, async ctx => {
  const [, company, route, dir] = ctx.update.callback_query.data.split(',')

  switch (company) {
    case 'NLB':
      await askStops(ctx, company, route, null, dir)
      break
    case 'CTB':
    case 'NWFB':
      await askStops(ctx, company, route, dir)
      break
  }
});

// Get the ETA
scene.action(ETA_ACTION_REGEX, async ctx => {
  const [, company, route, dir, stopId] = ctx.update.callback_query.data.split(',')
  let etas
  let str = '沒有到站時間預報⛔'

  switch (company) {
    case 'NLB':
      let routeId = dir
      etas = await getETA(company, routeId, stopId)
      if (etas.length === 0) break

      str = '預計到站時間如下⌚'
      for (const [i, eta] of etas.entries()) {
        const { time, departed, noGPS } = eta
        str += `\n${i + 1}. ${time} `

        if (!departed) {
          str += '未從總站開出'
        } else {
          str += '已從總站開出'
        }

        if (noGPS) {
          str += ', 預計時間'
        }
      }

      break
    case 'CTB':
    case 'NWFB':
      etas = await getETA(company, route, stopId)
      if (etas.length === 0) break

      str = '預計到站時間如下⌚'
      for (const [i, eta] of etas.entries()) {
        str += `\n${i + 1}. ${eta}`
      }
  }

  ctx.reply(str)
});

scene.use(ctx => ctx.reply('無此路線❌'))

const bot = new Telegraf(TOKEN)
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

        await askStops(ctx, company, route, null, routeId)
      }

      break
    case 'CTB':
    case 'NWFB':
      let inbound = await getRouteStop(company, route, 'inbound')
      inbound.length ? await askDirection(ctx, company, route) : await askStops(ctx, company, route)

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
        await askDirection(ctx, company, route, bound)
      } else if (bound.length === 1) {
        // Circular
        // TODO: AskStops
      } else {
        console.error(`Can't find information of route ${route}`);
        ctx.reply('無法找到此路線資料❌')
      }
      break
  }
}

async function askDirection(ctx, company, route, bound) {
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

async function askStops(ctx, company, route, dir = 'outbound', routeId) {
  let stopNames, stopIds, keyboard
  switch (company) {
    case 'NLB':
      [stopNames, stopIds] = await getRouteStop(company, route, null, routeId)
      keyboard = buildStopsKeyboard(ETA_ACTION, company, route, routeId, null, stopNames, stopIds)

      break
    case 'CTB':
    case 'NWFB':
      stopIds = await getRouteStop(company, route, dir)
      stopNames = await getStopsName(stopIds)
      keyboard = buildStopsKeyboard(ETA_ACTION, company, route, null, dir, stopNames, stopIds)
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
async function getRouteStop(company, route, dir, routeId) {
  let url, res
  switch (company) {
    case 'NLB':
      url = 'https://rt.data.gov.hk/v1/transport/nlb/stop.php?action=list'
      res = await axios.post(url, { routeId })
      let stopNames = [], stopIds = []

      for (const { stopName_c, stopId } of res.data.stops) {
        stopNames.push(stopName_c)
        stopIds.push(stopId)
      }

      return [stopNames, stopIds]
    case 'CTB':
    case 'NWFB':
      url = 'https://rt.data.gov.hk/v1/transport/citybus-nwfb/route-stop'
      res = await axios.get(url + `/${company}/${route}/${dir}`)
      let stops = []

      for (datum of res.data.data)
        stops.push(datum.stop)

      return stops
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

async function getETA(company, route, stop) {
  let url, res
  let etas = []

  switch (company) {
    case 'NLB':
      url = 'https://rt.data.gov.hk/v1/transport/nlb/stop.php?action=estimatedArrivals'
      res = await axios.post(url,
        {
          routeId: route,
          stopId: stop,
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
      url = 'https://rt.data.gov.hk/v1/transport/citybus-nwfb/eta'
      res = await axios.get(url + `/${company}/${stop}/${route}`)
      let data = res.data.data

      for (const { eta } of data) {
        const options = { hour12: 'true', timeZone: 'Asia/Hong_Kong' }
        const etaLocalTime = new Date(eta).toLocaleTimeString('en-HK', options).split(' ')[0]
        etas.push(etaLocalTime)
      }
  }
  return etas
}

function buildStopsKeyboard(action, company, route, routeId, dir, names, stopIds) {
  let keyboard = []
  let lastStop, callback

  if (names.length % 2 !== 0)
    lastStop = names.pop()

  switch (company) {
    case 'NLB':
      callback = `${action},${company},${route},${routeId}`
      break
    case 'CTB':
    case 'NWFB':
      callback = `${action},${company},${route},${dir}`
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