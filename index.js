require('dotenv').config()
require('./data/routes.json')
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

scene.hears(/[A-Za-z0-9]*[0-9][A-Za-z0-9]*/g, async ctx => {
  const route = ctx.update.message.text
  const companies = isValidRoute(route)

  if (companies.length > 1) {
    await askCompany(ctx, companies, route)
  } else if (companies.length === 1) {
    if (companies == 'CTB' || companies == 'NWFB') {
      checkCircular(ctx, companies, route)
    } else if (companies == 'NLB') {
      // TODO: NLB Bus
    }
  } else {
    ctx.reply('無此路線❌')
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
  await askStops(ctx, company, route, dir)
});

// Get the ETA
scene.action(ETA_ACTION_REGEX, async ctx => {
  const [, company, route, dir, stop] = ctx.update.callback_query.data.split(',')
  const etas = await getETA(company, route, stop)

  if (etas.length === 0) {
    ctx.reply('沒有到站時間預報⛔')
  } else {
    let str = '預計到站時間如下⌚'
    for (const [i, eta] of etas.entries()) {
      str += `\n${i + 1}. ${eta}`
    }
    ctx.reply(str)
  }
});

scene.use(ctx => ctx.reply('無此路線❌'))

const bot = new Telegraf(TOKEN)
const stage = new Stage([scene])

bot.use(session())
bot.use(stage.middleware())

bot.start(ctx => ctx.scene.enter('eta'))

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
  let inbound = await getRouteStop(company, route, 'inbound')

  if (inbound.length) {
    await askDirection(ctx, company, route)
  }
  else {
    await askStops(ctx, company, route)
  }
}

async function askDirection(ctx, company, route) {
  let routeInfo = await getRoute(company, route)
  const callback = `${STOPS_ACTION},${company},${route}`
  let orig = routeInfo.orig_tc
  let dest = routeInfo.dest_tc
  let inboundCallback = callback + ',inbound'
  let outboundCallback = callback + ',outbound'

  ctx.reply(
    '請選擇乘搭方向↔',
    Markup.inlineKeyboard([
      [
        { text: orig, callback_data: inboundCallback },
        { text: dest, callback_data: outboundCallback }
      ]
    ])
      .extra()
  )
}

async function askStops(ctx, company, route, dir = 'outbound') {
  let stopIds = await getRouteStop(company, route, dir)
  let stopNames = await getStopsName(stopIds)
  let keyboard = buildKeyboard(ETA_ACTION, company, route, dir, stopNames, stopIds)

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
  route = route.toUpperCase()
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
  let url = 'https://rt.data.gov.hk/v1/transport/citybus-nwfb/route'
  let res = await axios.get(url + `/${company}/${route}`)
  return res.data.data
}

// Get the list of stops of a direction of route in ID
async function getRouteStop(company, route, dir) {
  let url = 'https://rt.data.gov.hk/v1/transport/citybus-nwfb/route-stop'
  let res = await axios.get(url + `/${company}/${route}/${dir}`)
  let stops = []

  for (datum of res.data.data)
    stops.push(datum.stop)

  return stops
}

// Get the stop name of a list of stop ID
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
  let url = 'https://rt.data.gov.hk/v1/transport/citybus-nwfb/eta'
  let res = await axios.get(url + `/${company}/${stop}/${route}`)
  let data = res.data.data
  let etas = []

  for (datum of data) {
    const options = { hour12: 'true', timeZone: 'Asia/Hong_Kong' }
    const eta = new Date(datum.eta).toLocaleTimeString('en-HK', options).split(' ')[0]
    etas.push(eta)
  }
  return etas
}

function buildKeyboard(action, company, route, dir, names, ids) {
  let keyboard = []
  let lastStop

  if (names.length % 2 !== 0)
    lastStop = names.pop()

  for (let i = 0; i < names.length; i += 2) {
    const callback = `${action},${company},${route},${dir}`
    const callback1 = callback + `,${ids[i]}`
    const callback2 = callback + `,${ids[i + 1]}`

    const button = [
      { text: names[i], callback_data: callback1 },
      { text: names[i + 1], callback_data: callback2 }
    ]
    keyboard.push(button)
  }

  if (lastStop) {
    const callback3 = `${action},${company},${route},${dir},${ids.pop()}`
    keyboard.push([{ text: lastStop, callback_data: callback3 }])
  }

  return keyboard
}