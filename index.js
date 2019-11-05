require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const axios = require('axios')
const Telegraf = require('telegraf')

const TOKEN = process.env.API_KEY

const bot = new Telegraf(TOKEN)

bot.on('text', (ctx) => ctx.reply('👍'))

const app = express()

app.use(bot.webhookCallback('/message'))

// Finally, start our server
app.listen(3000, function() {
  console.log('Telegram app listening on port 3000!')
})
