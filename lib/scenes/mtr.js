require('moment/locale/en-gb')

const axios = require('axios')
const moment = require('moment')
const Telegraf = require('telegraf')
const Markup = require('telegraf/markup')

const analytics = require('../analytics')
const buildKeyboard = require('../keyboard')
const constants = require('../constants')
const { getStationName, getMTRETA } = require('../helper')
const { readJSON } = require('../io')

const lines = readJSON('mtr-lines')

const scene = new Telegraf.BaseScene(constants.MTR_SCENE_ID)

scene.command('bus', ctx => ctx.scene.enter(constants.BUS_SCENE_ID))
scene.on('message', ctx => ctx.scene.enter(constants.BUS_SCENE_ID))

// Ask for a metro line
scene.enter(async ctx => {
    let keyboard = buildKeyboard.lines()

    ctx.reply(
        '請選擇路綫🚆',
        Markup.inlineKeyboard(keyboard).extra()
    )
})

// Ask for a station of the line
scene.action(constants.STATIONS_ACTION_REGEX, ctx => {
    const [, line] = ctx.update.callback_query.data.split(',')
    let keyboard = buildKeyboard.stations(line)

    ctx.reply(
        '請選擇車站🚉',
        Markup.inlineKeyboard(keyboard).extra()
    )
})

// Check for ETA
scene.action(constants.MTR_ETA_ACTION_REGEX, async ctx => {
    const [, line, station] = ctx.update.callback_query.data.split(',')
    let res = await getMTRETA(line, station)
    let str = '預計到站時間如下⌚'


    // Special Train Services Arrangement Case
    if (res.status === 0) {
        ctx.reply(res.message + '\n' + res.url)
    } else if (res.isdelay === 'Y') {
        ctx.reply('列車服務延誤，未能提供到站時間預報\ud83d\ude47')
    } else {
        let stationETA = res.data[`${line}-${station}`]

        Object.values(stationETA).forEach((etas, idx) => {
            let count = 1

            if (idx === 2) {
                if (!etas.length) {
                    str += '\n尾班車已過'
                }
                for (let { ttnt: eta, dest } of etas) {
                    str += formatETAMessage(line, 'tc', count, eta, dest)
                    count += 1
                }
            } else if (idx === 3) {
                str += '\n---------------------'
                if (!etas.length) {
                    str += '\n尾班車已過'
                }
                for (let { ttnt: eta, dest } of etas) {
                    str += formatETAMessage(line, 'tc', count, eta, dest)
                    count += 1
                }
            }
        })

        ctx.reply(str)
    }
})

function formatETAMessage(line, lang, count, eta, dest) {
    dest = getStationName(line, dest, lang)
    
    return `\n${count}.\t${eta}分鐘\t往${dest}`
}

module.exports = scene
