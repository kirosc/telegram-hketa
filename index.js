require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const axios = require('axios')
const TelegramBot = require('node-telegram-bot-api');

const TOKEN = process.env.API_KEY

const bot = new TelegramBot(TOKEN);

const app = express()

app.use(bodyParser.json()) // for parsing application/json
app.use(
  bodyParser.urlencoded({
    extended: true
  })
) // for parsing application/x-www-form-urlencoded

// This is the route the API will call
app.post('/message', function(req, res) {
  bot.processUpdate(req.body);
  res.sendStatus(200);
})

bot.on('message', function onMessage(msg) {
  bot.sendMessage(msg.chat.id, 'World!!');
});

// Finally, start our server
app.listen(3000, function() {
  console.log('Telegram app listening on port 3000!')
})
