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
  // ctx => {
  //   ctx.reply(
  //     '請選擇巴士公司',
  //     Markup.inlineKeyboard([
  //       [
  //         { text: '城巴', callback_data: 'CTB' },
  //         { text: '新巴', callback_data: 'NWFB' }
  //       ]
  //     ])
  //       .oneTime()
  //       .resize()
  //       .extra()
  //   )
  //   return ctx.wizard.next()
  // },
  ctx => {
    ctx.reply('請輸入路線號碼🔢')
    return ctx.wizard.next();
  },
  ctx => {
    const route = ctx.update.message.text

    const company = isValidRoute(route)
    
    if (company) {
      ctx.reply(`此為${company}公司路線✔`)
    } else {
      ctx.reply('無此路線❌')
    }
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
app.listen(3000, function() {
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
  if(/[A-Za-z0-9]*[0-9][A-Za-z0-9]*/.test(route)) {
    for (company in routes){
      if (routes[company].includes(route))
        return company
    }
  }
}