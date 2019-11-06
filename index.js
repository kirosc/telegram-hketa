require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const axios = require('axios')
const Telegraf = require('telegraf')
const Extra = require('telegraf/extra')
const Markup = require('telegraf/markup')
const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const WizardScene = require('telegraf/scenes/wizard')

const TOKEN = process.env.API_KEY

const wizard = new WizardScene('eta',
  ctx => {
    console.log('1');

    ctx.reply(
      '請選擇巴士公司',
      Markup.inlineKeyboard([
        [
          { text: '城巴', callback_data: 'CTB' },
          { text: '新巴', callback_data: 'NWFB' }
        ]
      ])
        .oneTime()
        .resize()
        .extra()
    )
    return ctx.wizard.next()
  },
  ctx => {
    console.log('2');
    
    const companyID = ctx.update.callback_query.data
    ctx.reply('請輸入路線號碼')
    return ctx.wizard.next();
  },
  ctx => {
    const route = ctx.update.message.text
    console.log(route);
    
    if (/[A-Za-z0-9]*[0-9][A-Za-z0-9]*/.test(route)) {
      ctx.reply('Valid route')
    } else {
      ctx.reply('Invalid route')
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
