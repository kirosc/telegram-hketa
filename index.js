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
          let inboundCallback= JSON.stringify({ ...callback, dir: 'inbound' })
          let outboundCallback= JSON.stringify({ ...callback, dir: 'outbound' })

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
    let dir = ctx.update.callback_query.data
    console.log(dir);
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

async function getRoute(company, route) {
  let url = 'https://rt.data.gov.hk/v1/transport/citybus-nwfb/route'
  let res = await axios.get(url + `/${company}/${route}`)
  return res.data.data
}

async function getRouteStop(company, route, dir) {
  let url = 'https://rt.data.gov.hk/v1/transport/citybus-nwfb/route-stop'
  let res = await axios.get(url + `/${company}/${route}/${dir}`)
  return res.data.data
}
