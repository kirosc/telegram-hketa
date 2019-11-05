require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const axios = require('axios')
const Telegraf = require('telegraf')
const Extra = require('telegraf/extra')
const Markup = require('telegraf/markup')

const TOKEN = process.env.API_KEY

const bot = new Telegraf(TOKEN)

bot.on('text', ({reply}) => {
  return reply(
    '請選擇巴士公司',
    Markup.inlineKeyboard([
      [
        { text: '城巴', callback_data: 'NWFB' },
        { text: '新巴', callback_data: 'CTB' }
      ]
    ])
      .oneTime()
      .resize()
      .extra()
  )
})

bot.on('callback_query', ({update, reply}) => {
  const data = update.callback_query.data
  return reply(`You hit ${data}`)
})

const app = express()

app.use(bot.webhookCallback('/message'))

// Finally, start our server
app.listen(3000, function() {
  console.log('Telegram app listening on port 3000!')
})
