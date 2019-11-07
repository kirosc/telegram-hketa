require('dotenv').config()
require('./data/routes.json')
const fs = require('fs')
const express = require('express')
const bodyParser = require('body-parser')
const axios = require('axios')
const Telegraf = require('telegraf')
const Extra = require('telegraf/extra')
const Markup = require('telegraf/markup')
const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const WizardScene = require('telegraf/scenes/wizard')

let routes = readRoutes()

const TOKEN = process.env.API_KEY

const wizard = new WizardScene('eta',
  ctx => {
    ctx.reply('請輸入路線號碼🔢')
    return ctx.wizard.next();
  },
  async ctx => {
    const route = ctx.update.message.text

    const company = isValidRoute(route)

    if (company) {
      if (company == 'CTB' || company == 'NWFB') {
        let [inbound, outbound] = await Promise.all([getRouteStop(company, route, 'inbound'), getRouteStop(company, route, 'outbound')])

        if (inbound.length) {
          let routeInfo = await getRoute(company, route)
          const callback = {
            company,
            route
          }
          let orig = routeInfo.orig_tc
          let dest = routeInfo.dest_tc
          let inboundCallback = JSON.stringify({ ...callback, dir: 'inbound' })
          let outboundCallback = JSON.stringify({ ...callback, dir: 'outbound' })

          ctx.reply(
            '請選擇乘搭方向↔',
            Markup.inlineKeyboard([
              [
                { text: orig, callback_data: inboundCallback },
                { text: dest, callback_data: outboundCallback }
              ]
            ])
              .oneTime()
              .resize()
              .extra()
          )
          return ctx.wizard.next()
        }
        else {
          // Circular route
        }
      } else if (company == 'NLB') {
        // TODO: NLB Bus
      }
    } else {
      ctx.reply('無此路線❌')
    }
  },
  async ctx => {
    if (!ctx.update.hasOwnProperty('callback_query')) {
      console.log('No callback data');
      return
    }

    let { company, route, dir } = JSON.parse(ctx.update.callback_query.data)
    let ids = await getRouteStop(company, route, dir)
    let names = await getStopsName(ids)
    let keyboard = genKeyboard(company, route, dir, names, ids)

    ctx.reply(
      '請選擇巴士站🚏',
      Markup.inlineKeyboard(keyboard)
        .oneTime()
        .resize()
        .extra()
    )
    return ctx.wizard.next();
  },
  async ctx => {
    return ctx.scene.leave();
  }
)

const bot = new Telegraf(TOKEN)
const stage = new Stage([wizard], { default: 'eta' })

bot.use(session())
bot.use(stage.middleware())

bot.start(ctx => ctx.scene.enter('eta'))

const app = express()

app.use(bot.webhookCallback('/message'))

// Finally, start our server
app.listen(3000, function () {
  console.log('Telegram app listening on port 3000!')
})

// Get the routes data from Json file
function readRoutes() {
  try {
    const json = fs.readFileSync('./data/routes.json', 'utf8')
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
    for (company in routes) {
      if (routes[company].includes(route))
        return company
    }
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
    const options = { hour12: 'true' }
    const eta = new Date(datum.eta).toLocaleTimeString('en-GB', options).split(' ')[0]
    etas.push(eta)
  }
  return etas
}

function genKeyboard(company, route, dir, names, ids) {
  let keyboard = []
  let lastStop

  if (names.length % 2 !== 0)
      lastStop = names.pop()

    for (let i = 0; i < names.length; i += 2) {
      const callback = {
        company,
        route,
        dir
      }
      const callback1 = JSON.stringify({ ...callback, stop: ids[i] })
      const callback2 = JSON.stringify({ ...callback, stop: ids[i+1] })
      // Two buttons per row
      const button = [
        {text: names[i], callback_data: callback1},
        {text: names[i+1], callback_data: callback2}
      ]
      keyboard.push(button)
    }

    if (lastStop)
      keyboard.push([{ text: lastStop, callback_data: 'test' }])

    return keyboard
}