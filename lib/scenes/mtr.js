require('moment/locale/en-gb')

const axios = require('axios')
const moment = require('moment')
const Telegraf = require('telegraf')
const Markup = require('telegraf/markup')

const analytics = require('../analytics')
const buildKeyboard = require('../keyboard')
const constants = require('../constants')
const { readJSON } = require('../io')

const lines = readJSON('mtr-lines')

const scene = new Telegraf.BaseScene(constants.MTR_SCENE_ID)

scene.command('bus', ctx => ctx.scene.enter(constants.BUS_SCENE_ID))
scene.on('message', ctx => ctx.scene.enter(constants.BUS_SCENE_ID))

// Ask for metro lines
scene.enter(ctx => {
    let keyboard = buildKeyboard.lines()

    ctx.reply(
        '請選擇路綫🚆',
        Markup.inlineKeyboard(keyboard).extra()
    )
})

module.exports = scene
