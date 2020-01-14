require('dotenv').config()
const express = require('express')
const axios = require('axios')
const ua = require('universal-analytics')
const Telegraf = require('telegraf')
const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const Sentry = require('@sentry/node')

const constants = require('../lib/constants')

const busScene = require('../lib/scenes/bus')

// Error tracking
if (constants.ENV === 'production') {
  Sentry.init({ dsn: `https://${constants.SENTRY_TOKEN}@sentry.io/1873982` })
  axios.interceptors.response.use(null, function (err) {
    Sentry.captureException(err);
    console.error(err)
  })
}

const bot = new Telegraf(constants.TG_TOKEN)
const stage = new Stage([busScene])

bot.use(session())
bot.use(stage.middleware())

bot.start(ctx => ctx.reply('請輸入巴士路線號碼🔢'))

bot.command('contribute', ctx => ctx.replyWithMarkdown(
  `Make this bot better!
[Open Source Project](https://github.com/kirosc/tg-hketa)`))

bot.on('message', ctx => ctx.scene.enter('bus'))

const app = express()

app.use(bot.webhookCallback('/message'))

// Finally, start our server
app.listen(3000, function () {
  console.log('Telegram app listening on port 3000!')
})
