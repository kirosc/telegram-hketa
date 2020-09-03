const Telegraf = require('telegraf');
const Markup = require('telegraf/markup');

const analytics = require('../analytics');
const buildKeyboard = require('../keyboard');
const constants = require('../constants');
const { getStationName, getMTRETA } = require('../helper');

const scene = new Telegraf.BaseScene(constants.MTR_SCENE_ID);

scene.command('bus', ctx => ctx.scene.enter(constants.BUS_SCENE_ID));
scene.command('lrt', ctx => ctx.scene.enter(constants.LRT_SCENE_ID));
scene.on('message', ctx => ctx.scene.enter(constants.BUS_SCENE_ID));

// Ask for a metro line
scene.enter(async ctx => {
    let keyboard = buildKeyboard.lines();

    ctx.reply(
        '請選擇路綫🚆',
        Markup.inlineKeyboard(keyboard).extra()
    );

    analytics.send(ctx, { ec: 'mtr', ea: 'start' });
});

// Ask for a station of the line
scene.action(constants.STATIONS_ACTION_REGEX, ctx => {
    const [, line] = ctx.update.callback_query.data.split(',');
    let keyboard = buildKeyboard.stations(line);

    ctx.reply(
        '請選擇車站🚉',
        Markup.inlineKeyboard(keyboard).extra()
    );
});

// Check for ETA
scene.action(constants.MTR_ETA_ACTION_REGEX, async ctx => {
    const [, line, station] = ctx.update.callback_query.data.split(',');
    let res = await getMTRETA(line, station);
    let str = '預計到站時間如下⌚';

    // Special Train Services Arrangement Case
    if (res.status === 0) {
        ctx.reply(res.message + '\n' + res.url);
    } else if (res.isdelay === 'Y') {
        ctx.reply('列車服務延誤，未能提供到站時間預報\ud83d\ude47');
    } else {
        let stationETA = res.data[`${line}-${station}`];

        Object.values(stationETA).forEach((etas, idx) => {
            str += extractETA(line, etas, idx);
        });

        ctx.reply(str);
    }

    let params = {
        ec: 'mtr',
        ea: line,
        el: station,
        ev: res.status
    };
    analytics.send(ctx, params);
});

// Extract ETA from the API response
function extractETA(line, etas, idx) {
    let count = 1, str = '';

    // ETA data locates at index 2 and 3
    if (idx === 2) {
        if (!etas.length) {
            str += '\n尾班車已過';
        }
        for (let { ttnt: eta, dest } of etas) {
            str += formatETAMessage(line, 'tc', count, eta, dest);
            count += 1;
        }
    } else if (idx === 3) {
        str += '\n------------------------';
        if (!etas.length) {
            str += '\n尾班車已過';
        }
        for (let { ttnt: eta, dest } of etas) {
            str += formatETAMessage(line, 'tc', count, eta, dest);
            count += 1;
        }
    }

    return str;
}

function formatETAMessage(line, lang, count, eta, dest) {
    dest = getStationName(line, dest, lang);

    return `\n${count}.\t${eta}分鐘\t往${dest}`;
}

module.exports = scene;
