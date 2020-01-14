require('dotenv').config()
const express = require('express')
const axios = require('axios')
const Telegraf = require('telegraf')
const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const Sentry = require('@sentry/node')

const constants = require('../lib/constants')

const busScene = require('../lib/scenes/bus')
const mtrScene = require('../lib/scenes/mtr')

// Error tracking
if (constants.ENV === 'production') {
  Sentry.init({ dsn: `https://${constants.SENTRY_TOKEN}@sentry.io/1873982` })
  axios.interceptors.response.use(null, function (err) {
    Sentry.captureException(err);
    console.error(err)
  })
}

const bot = new Telegraf(constants.TG_TOKEN)
const stage = new Stage([busScene, mtrScene])

bot.command('contribute', ctx => ctx.replyWithMarkdown(
  `Make this bot better!
[Open Source Project](https://github.com/kirosc/tg-hketa)`))

bot.start(ctx => ctx.reply('請輸入巴士路線號碼🔢'))

bot.use(session())
bot.use(stage.middleware())

bot.command('bus', ctx => ctx.scene.enter(constants.BUS_SCENE_ID))
bot.command('mtr', ctx => ctx.scene.enter(constants.MTR_SCENE_ID))

bot.on('message', ctx => ctx.scene.enter(constants.BUS_SCENE_ID))

const app = express()

app.use(bot.webhookCallback('/message'))

// Finally, start our server
app.listen(3000, function () {
  console.log('Telegram app listening on port 3000!')
})
